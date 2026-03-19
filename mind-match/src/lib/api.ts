const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: any = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please make sure the backend is running on http://localhost:5000');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Auth endpoints
  async signup(email: string, password: string, name: string, collegeName: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, collegeName }),
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getMe() {
    return this.request<any>('/auth/me', {
      method: 'GET',
    });
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return response;
  }

  // User endpoints
  async getUserProfile() {
    return this.request<any>('/users/profile', {
      method: 'GET',
    });
  }

  async getUserById(userId: string) {
    return this.request<any>(`/users/${userId}`, {
      method: 'GET',
    });
  }

  async updateUserProfile(data: any) {
    return this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Skills endpoints
  async getSkills() {
    return this.request<any[]>('/skills', {
      method: 'GET',
    });
  }

  async updateSkills(skills: Array<{ skillName: string; level: string }>) {
    return this.request('/users/onboarding/skills', {
      method: 'PUT',
      body: JSON.stringify({ skills }),
    });
  }

  async updateGoals(goals: string[]) {
    return this.request('/users/onboarding/goals', {
      method: 'PUT',
      body: JSON.stringify({ goals }),
    });
  }

  async updateProficiency(proficiency: string) {
    return this.updateUserProfile({ proficiency });
  }

  // Matches endpoints
  async getRecommendedMatches(limit: number = 20, minScore: number = 30) {
    return this.request<{ matches: any[] }>(`/matches/recommended?limit=${limit}&minScore=${minScore}`, {
      method: 'GET',
    });
  }

  async refreshMatches() {
    return this.request('/matches/refresh', {
      method: 'POST',
    });
  }

  // Study Requests endpoints
  async sendStudyRequest(toUserId: string, message?: string) {
    return this.request('/requests/send', {
      method: 'POST',
      body: JSON.stringify({ toUser: toUserId, message }),
    });
  }

  async getReceivedRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/requests/received${query}`, {
      method: 'GET',
    });
  }

  async getSentRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/requests/sent${query}`, {
      method: 'GET',
    });
  }

  async acceptRequest(requestId: string) {
    return this.request(`/requests/${requestId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectRequest(requestId: string) {
    return this.request(`/requests/${requestId}/reject`, {
      method: 'PUT',
    });
  }

  async cancelRequest(requestId: string) {
    return this.request(`/requests/${requestId}/cancel`, {
      method: 'DELETE',
    });
  }

  async getConnectionStatus(userId: string) {
    return this.request<{ status: string; requestId?: string; conversationId?: string }>(`/requests/status/${userId}`, {
      method: 'GET',
    });
  }

  // Groups endpoints
  async getRecommendedGroups(limit: number = 10) {
    return this.request<{ groups: any[] }>(`/groups/recommended?limit=${limit}`, {
      method: 'GET',
    });
  }

  async createGroup(data: { name: string; topic: string; description?: string; isPublic: boolean; tags?: string[] }) {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinGroup(groupId: string) {
    return this.request(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: string) {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getMyGroups() {
    return this.request<{ groups: any[] }>('/groups/my-groups', {
      method: 'GET',
    });
  }

  async getGroupById(groupId: string) {
    return this.request<{ group: any }>(`/groups/${groupId}`, {
      method: 'GET',
    });
  }

  // Status endpoints
  async updateStatus(activityText: string) {
    return this.request('/status', {
      method: 'POST',
      body: JSON.stringify({ activityText }),
    });
  }

  async getActiveStatuses() {
    return this.request<any[]>('/status/active', {
      method: 'GET',
    });
  }

  // Resources endpoints
  async getResources(filters?: { tags?: string[] }) {
    const query = filters?.tags ? `?tags=${filters.tags.join(',')}` : '';
    return this.request<any[]>(`/resources${query}`, {
      method: 'GET',
    });
  }

  async createResource(data: { title: string; link: string; description: string; tags: string[] }) {
    return this.request('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async upvoteResource(resourceId: string) {
    return this.request(`/resources/${resourceId}/upvote`, {
      method: 'POST',
    });
  }

  // Profile endpoints
  async getProfile(userId: string) {
    return this.request<any>(`/profile/${userId}`, {
      method: 'GET',
    });
  }

  async updateProfileData(data: any) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePrivacySettings(settings: any) {
    return this.request('/profile/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async submitCollegeVerification(data: { method: string; documentUrl?: string; eduEmail?: string }) {
    return this.request('/profile/verify/college', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitSkillVerification(data: { skillName: string; method: string; verificationData: any }) {
    return this.request('/profile/verify/skill', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVerificationStatus() {
    return this.request<any>('/profile/verification-status', {
      method: 'GET',
    });
  }

  // Enhanced Chat endpoints
  async getConversations(includeArchived = false) {
    return this.request<any>(`/chat/conversations?includeArchived=${includeArchived}`, {
      method: 'GET',
    });
  }

  async createConversation(data: { participantIds: string[]; isGroup?: boolean; groupName?: string; groupDescription?: string }) {
    return this.request('/chat/conversation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessages(conversationId: string, limit = 50, before?: string) {
    const query = before ? `?limit=${limit}&before=${before}` : `?limit=${limit}`;
    return this.request<any>(`/chat/${conversationId}/messages${query}`, {
      method: 'GET',
    });
  }

  async markConversationAsRead(conversationId: string) {
    return this.request(`/chat/${conversationId}/mark-read`, {
      method: 'POST',
    });
  }

  async sendMessage(conversationId: string, data: {
    text: string;
    messageType?: string;
    fileUrl?: string;
    fileType?: string;
    fileName?: string;
    codeSnippet?: { code: string; language: string };
  }) {
    return this.request(`/chat/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async editMessage(messageId: string, text: string) {
    return this.request(`/chat/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  }

  async deleteMessage(messageId: string) {
    return this.request(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.request(`/chat/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async addReaction(messageId: string, emoji: string) {
    return this.request(`/chat/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async toggleStarMessage(messageId: string) {
    return this.request(`/chat/messages/${messageId}/star`, {
      method: 'POST',
    });
  }

  async searchMessages(query: string, conversationId?: string) {
    const params = conversationId ? `?query=${query}&conversationId=${conversationId}` : `?query=${query}`;
    return this.request<any>(`/chat/search${params}`, {
      method: 'GET',
    });
  }

  async toggleMuteConversation(conversationId: string, mutedUntil?: Date) {
    return this.request(`/chat/conversations/${conversationId}/mute`, {
      method: 'POST',
      body: JSON.stringify({ mutedUntil }),
    });
  }

  async toggleArchiveConversation(conversationId: string) {
    return this.request(`/chat/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ url: string; type: string; filename: string }>('/chat/upload', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

