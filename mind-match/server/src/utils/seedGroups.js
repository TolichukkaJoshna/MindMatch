import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultGroups = [
    {
        name: 'React Developers',
        topic: 'React',
        description: 'A community for React developers to share knowledge, discuss best practices, and collaborate on projects.',
        tags: ['react', 'javascript', 'frontend', 'web development'],
        isPublic: true,
    },
    {
        name: 'Python Programming',
        topic: 'Python',
        description: 'Learn and discuss Python programming, from basics to advanced topics including data science and machine learning.',
        tags: ['python', 'programming', 'data science', 'machine learning'],
        isPublic: true,
    },
    {
        name: 'Web Development Basics',
        topic: 'Web Development',
        description: 'Perfect for beginners learning HTML, CSS, and JavaScript. Get help and share your progress!',
        tags: ['html', 'css', 'javascript', 'beginner'],
        isPublic: true,
    },
    {
        name: 'Data Structures & Algorithms',
        topic: 'Computer Science',
        description: 'Master DSA concepts, solve coding challenges together, and prepare for technical interviews.',
        tags: ['algorithms', 'data structures', 'coding', 'interview prep'],
        isPublic: true,
    },
    {
        name: 'Node.js Backend Development',
        topic: 'Backend Development',
        description: 'Discuss Node.js, Express, databases, APIs, and everything backend development.',
        tags: ['nodejs', 'backend', 'express', 'api'],
        isPublic: true,
    },
    {
        name: 'Machine Learning Study Group',
        topic: 'Machine Learning',
        description: 'Explore ML algorithms, work on projects, and discuss the latest in AI and machine learning.',
        tags: ['machine learning', 'ai', 'deep learning', 'tensorflow'],
        isPublic: true,
    },
    {
        name: 'Mobile App Development',
        topic: 'Mobile Development',
        description: 'iOS, Android, React Native, Flutter - discuss all things mobile app development.',
        tags: ['mobile', 'ios', 'android', 'react native', 'flutter'],
        isPublic: true,
    },
    {
        name: 'Database Design & SQL',
        topic: 'Databases',
        description: 'Learn database design, SQL queries, optimization, and work with different database systems.',
        tags: ['sql', 'database', 'postgresql', 'mongodb'],
        isPublic: true,
    },
];

async function seedDefaultGroups() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find or create a system user for group creation
        let systemUser = await User.findOne({ email: 'system@mindmatch.com' });

        if (!systemUser) {
            systemUser = await User.create({
                name: 'MindMatch',
                email: 'system@mindmatch.com',
                password: 'system-user-no-login-password',
                collegeName: 'System',
                isOnboardingComplete: true,
                skills: [{ skillName: 'System', level: 'advanced' }],
                goals: ['project'],
            });
            console.log('✅ Created system user');
        }

        // Check if default groups already exist
        const existingGroups = await Group.find({ creator: systemUser._id });

        if (existingGroups.length > 0) {
            console.log(`ℹ️  ${existingGroups.length} default groups already exist. Skipping seed.`);
            process.exit(0);
        }

        // Create default groups
        for (const groupData of defaultGroups) {
            // Create conversation for the group
            const conversation = await Conversation.create({
                participants: [systemUser._id],
                isGroup: true,
                groupName: groupData.name,
            });

            // Create the group
            const group = await Group.create({
                ...groupData,
                creator: systemUser._id,
                members: [
                    {
                        userId: systemUser._id,
                        role: 'admin',
                    },
                ],
                conversationId: conversation._id,
                activityScore: 100, // High activity score for default groups
            });

            console.log(`✅ Created group: ${group.name}`);
        }

        console.log(`\n🎉 Successfully seeded ${defaultGroups.length} default groups!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding default groups:', error);
        process.exit(1);
    }
}

seedDefaultGroups();
