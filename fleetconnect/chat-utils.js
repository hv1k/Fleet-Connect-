// chat-utils.js - Shared messaging utility for FleetConnect chat system
// Provides real-time messaging through Supabase with role-based visibility

/**
 * Send a message in a job's chat
 * @param {string} jobId - Job ID
 * @param {string} content - Message content
 * @param {string} attachmentUrl - Optional attachment URL (image/file)
 * @returns {Promise<Object>} Message object or error
 */
async function sendMessage(jobId, content, attachmentUrl = null) {
  try {
    if (!jobId || !content.trim()) {
      return { success: false, error: 'Job ID and content are required' };
    }

    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await db.from('messages')
      .insert([{
        job_id: jobId,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: user.role,
        content: sanitizeInput(content.trim()),
        attachment_url: attachmentUrl,
        created_at: new Date().toISOString(),
        read_by: []
      }])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    console.log('[Chat] Message sent:', data.id);
    return { success: true, message: data };
  } catch (err) {
    console.error('[Chat] Send message error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get conversations for current user (filtered by role)
 * @param {string} userId - User ID
 * @param {string} role - User role (admin, vendor, rental, fieldworker)
 * @returns {Promise<Array>} Array of job conversations
 */
async function getConversations(userId, role) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    let jobIds = [];

    // Get jobs based on user role
    if (role === 'admin') {
      // Admin sees all jobs
      const { data } = await db.from('jobs').select('id').order('created_at', { ascending: false });
      jobIds = (data || []).map(j => j.id);
    } else if (role === 'vendor') {
      // Vendor sees their assigned jobs + unassigned job pool
      const user = getCurrentUser();
      const { data: vendorJobs } = await db.from('jobs')
        .select('id')
        .eq('assigned_vendor', user.vendor_id)
        .order('created_at', { ascending: false });

      const { data: unassignedJobs } = await db.from('jobs')
        .select('id')
        .is('assigned_vendor', null)
        .in('status', ['pending', 'open'])
        .order('created_at', { ascending: false });

      jobIds = [...(vendorJobs || []).map(j => j.id), ...(unassignedJobs || []).map(j => j.id)];
    } else if (role === 'rental') {
      // Rental sees jobs they created
      const { data } = await db.from('jobs')
        .select('id')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      jobIds = (data || []).map(j => j.id);
    } else if (role === 'fieldworker') {
      // Field worker sees assigned jobs
      const { data } = await db.from('jobs')
        .select('id')
        .eq('assigned_worker', userId)
        .order('created_at', { ascending: false });
      jobIds = (data || []).map(j => j.id);
    }

    if (jobIds.length === 0) {
      return { success: true, conversations: [] };
    }

    // Get last message for each job
    const { data: jobs } = await db.from('jobs')
      .select('id, job_site_name, customer_name, status')
      .in('id', jobIds.slice(0, 50)) // Limit to first 50 for performance
      .order('created_at', { ascending: false });

    const conversations = [];
    for (const job of jobs || []) {
      const { data: messages } = await db.from('messages')
        .select('id, content, sender_name, created_at, read_by')
        .eq('job_id', job.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = messages?.[0];
      const unreadCount = lastMessage?.read_by ? (Array.isArray(lastMessage.read_by) ?
        (lastMessage.read_by.includes(userId) ? 0 : 1) : 0) : 1;

      conversations.push({
        jobId: job.id,
        jobName: job.job_site_name || job.customer_name || `Job #${job.id.slice(0, 8)}`,
        status: job.status,
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageAuthor: lastMessage?.sender_name || 'System',
        lastMessageTime: lastMessage?.created_at || job.created_at,
        unreadCount: unreadCount
      });
    }

    return { success: true, conversations };
  } catch (err) {
    console.error('[Chat] Get conversations error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get messages for a specific job
 * @param {string} jobId - Job ID
 * @param {number} limit - Number of messages to fetch (default 50)
 * @param {number} offset - Pagination offset (default 0)
 * @returns {Promise<Object>} Messages and metadata
 */
async function getMessages(jobId, limit = 50, offset = 0) {
  try {
    if (!jobId) {
      return { success: false, error: 'Job ID required' };
    }

    const { data: messages, error } = await db.from('messages')
      .select('id, sender_id, sender_name, sender_role, content, attachment_url, created_at, read_by')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messages: messages || [], total: (messages || []).length };
  } catch (err) {
    console.error('[Chat] Get messages error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark messages as read
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID reading the messages
 * @returns {Promise<Object>} Success status
 */
async function markAsRead(jobId, userId) {
  try {
    if (!jobId || !userId) {
      return { success: false, error: 'Job ID and user ID required' };
    }

    // Get all unread messages for this user
    const { data: messages } = await db.from('messages')
      .select('id, read_by')
      .eq('job_id', jobId);

    // Mark each as read
    for (const msg of messages || []) {
      const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await db.from('messages')
          .update({ read_by: readBy })
          .eq('id', msg.id);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[Chat] Mark as read error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to real-time messages for a job
 * @param {string} jobId - Job ID
 * @param {Function} callback - Callback when new message arrives
 * @returns {Object} Subscription object with unsubscribe method
 */
function subscribeToMessages(jobId, callback) {
  try {
    if (!jobId || typeof callback !== 'function') {
      console.error('[Chat] Invalid subscribe parameters');
      return null;
    }

    const channel = db.channel(`messages-${jobId}`, {
      config: { broadcast: { ack: false } }
    })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload) => {
          console.log('[Chat] New message received:', payload.new.id);
          callback({ type: 'INSERT', message: payload.new });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload) => {
          console.log('[Chat] Message updated:', payload.new.id);
          callback({ type: 'UPDATE', message: payload.new });
        }
      )
      .subscribe((status) => {
        console.log(`[Chat] Subscription status for ${jobId}:`, status);
      });

    return {
      channel,
      unsubscribe: () => {
        db.removeChannel(channel);
        console.log(`[Chat] Unsubscribed from ${jobId}`);
      }
    };
  } catch (err) {
    console.error('[Chat] Subscribe error:', err);
    return null;
  }
}

/**
 * Get unread message count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total unread message count
 */
async function getUnreadCount(userId) {
  try {
    if (!userId) {
      return 0;
    }

    // Get all messages where user is not in read_by array
    const { data, error } = await db.from('messages')
      .select('id', { count: 'exact', head: true })
      .not('read_by', 'cs', JSON.stringify([userId]));

    if (error) {
      console.warn('[Chat] Error getting unread count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('[Chat] Get unread count error:', err);
    return 0;
  }
}

/**
 * Search conversations by text
 * @param {string} searchText - Search query
 * @param {Array} conversations - Array of conversation objects
 * @returns {Array} Filtered conversations
 */
function searchConversations(searchText, conversations) {
  if (!searchText.trim()) {
    return conversations;
  }

  const query = searchText.toLowerCase();
  return conversations.filter((conv) => {
    return conv.jobName.toLowerCase().includes(query) ||
           conv.lastMessage.toLowerCase().includes(query) ||
           conv.lastMessageAuthor.toLowerCase().includes(query);
  });
}

/**
 * Format message time
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted time string
 */
function formatMessageTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get role badge styling
 * @param {string} role - User role
 * @returns {Object} Badge styling object
 */
function getRoleBadge(role) {
  const badges = {
    admin: { bg: '#1e1e30', color: '#818cf8', icon: '⚙️' },
    vendor: { bg: '#1e2c2c', color: '#fbbf24', icon: '🏢' },
    rental: { bg: '#1e2a3c', color: '#60a5fa', icon: '🚗' },
    fieldworker: { bg: '#1e2c1e', color: '#22c55e', icon: '👷' }
  };
  return badges[role] || { bg: '#0f0f1a', color: '#7a7a92', icon: '👤' };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
    subscribeToMessages,
    getUnreadCount,
    searchConversations,
    formatMessageTime,
    getRoleBadge
  };
}
