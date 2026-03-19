import User from '../models/User.js';
import Match from '../models/Match.js';

/**
 * Smart Matching Algorithm
 * Total Score = (Skill Match × 0.6) + (Location Match × 0.2) + (Goal Match × 0.2)
 */

// Calculate skill match score
const calculateSkillMatch = (user1Skills, user2Skills) => {
    if (!user1Skills.length || !user2Skills.length) return 0;

    const user1SkillMap = new Map(
        user1Skills.map((s) => [s.skillName.toLowerCase(), s.level])
    );
    const user2SkillMap = new Map(
        user2Skills.map((s) => [s.skillName.toLowerCase(), s.level])
    );

    let commonSkills = [];
    let totalScore = 0;
    let matchCount = 0;

    // Find common skills
    for (const [skillName, level1] of user1SkillMap) {
        if (user2SkillMap.has(skillName)) {
            commonSkills.push(skillName);
            const level2 = user2SkillMap.get(skillName);

            // Same level = 100% match for this skill
            if (level1 === level2) {
                totalScore += 100;
            }
            // Complementary levels (beginner + advanced) = 80%
            else if (
                (level1 === 'beginner' && level2 === 'advanced') ||
                (level1 === 'advanced' && level2 === 'beginner')
            ) {
                totalScore += 80;
            }
            // Intermediate match = 70%
            else {
                totalScore += 70;
            }
            matchCount++;
        }
    }

    if (matchCount === 0) return { score: 0, commonSkills: [] };

    return {
        score: totalScore / matchCount,
        commonSkills,
    };
};

// Calculate location match score
const calculateLocationMatch = (location1, location2) => {
    if (!location1 || !location2) return 0;

    // Same college = 100%
    if (
        location1.college &&
        location2.college &&
        location1.college.toLowerCase() === location2.college.toLowerCase()
    ) {
        return 100;
    }

    // Same city = 70%
    if (
        location1.city &&
        location2.city &&
        location1.city.toLowerCase() === location2.city.toLowerCase()
    ) {
        return 70;
    }

    // Same country = 40%
    if (
        location1.country &&
        location2.country &&
        location1.country.toLowerCase() === location2.country.toLowerCase()
    ) {
        return 40;
    }

    return 0;
};

// Calculate goal match score
const calculateGoalMatch = (goals1, goals2) => {
    if (!goals1.length || !goals2.length) return 0;

    const commonGoals = goals1.filter((g) => goals2.includes(g));

    if (commonGoals.length === 0) return 0;

    // Percentage of common goals
    const matchPercentage =
        (commonGoals.length / Math.max(goals1.length, goals2.length)) * 100;

    return matchPercentage;
};

// Calculate total compatibility score
export const calculateCompatibility = (user1, user2) => {
    const skillResult = calculateSkillMatch(user1.skills, user2.skills);
    const locationScore = calculateLocationMatch(user1.location, user2.location);
    const goalScore = calculateGoalMatch(user1.goals, user2.goals);

    // Weighted average
    const totalScore =
        skillResult.score * 0.6 + locationScore * 0.2 + goalScore * 0.2;

    return {
        score: Math.round(totalScore),
        breakdown: {
            skillMatch: Math.round(skillResult.score),
            locationMatch: Math.round(locationScore),
            goalMatch: Math.round(goalScore),
        },
        commonSkills: skillResult.commonSkills,
    };
};

// Find matches for a single user
export const findMatchesForUser = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.isOnboardingComplete()) {
            return [];
        }

        // Get all other users who have completed onboarding
        const otherUsers = await User.find({
            _id: { $ne: userId },
            skills: { $exists: true, $ne: [] },
            goals: { $exists: true, $ne: [] },
        });

        const matches = [];

        for (const otherUser of otherUsers) {
            const compatibility = calculateCompatibility(user, otherUser);

            // Only store matches with score > 20%
            if (compatibility.score > 20) {
                matches.push({
                    userId: user._id,
                    matchedUserId: otherUser._id,
                    score: compatibility.score,
                    breakdown: compatibility.breakdown,
                    commonSkills: compatibility.commonSkills,
                });
            }
        }

        // Sort by score descending and take top 20
        matches.sort((a, b) => b.score - a.score);
        const topMatches = matches.slice(0, 20);

        // Delete old matches for this user
        await Match.deleteMany({ userId });

        // Insert new matches
        if (topMatches.length > 0) {
            await Match.insertMany(topMatches);
        }

        console.log(`✅ Found ${topMatches.length} matches for user ${userId}`);
        return topMatches;
    } catch (error) {
        console.error('Error finding matches for user:', error);
        return [];
    }
};

// Batch process matches for all users
export const batchProcessMatches = async () => {
    try {
        console.log('🔄 Starting batch match processing...');

        const users = await User.find({
            skills: { $exists: true, $ne: [] },
            goals: { $exists: true, $ne: [] },
        }).select('_id');

        let processedCount = 0;

        for (const user of users) {
            await findMatchesForUser(user._id);
            processedCount++;
        }

        console.log(`✅ Batch processing complete. Processed ${processedCount} users`);
        return processedCount;
    } catch (error) {
        console.error('Error in batch match processing:', error);
        throw error;
    }
};
