import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Bell, MessageCircle, AlertCircle, CheckCircle, 
  Clock, UserCheck, DollarSign, Shield, X,
  Mail, Megaphone, Users, Flag, Gift, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const PRAQEN = {
  primary: '#2D5F4F',
  secondary: '#FFD700',
  lightBg: '#f0f8f5',
};

export default function Notifications({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Check for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
      const unread = response.data.notifications?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Set mock notifications for demo
      setNotifications(getMockNotifications());
      setUnreadCount(3);
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = () => {
    return [
      {
        id: '1',
        type: 'trade',
        title: 'New Trade Request',
        message: 'User wants to buy your Amazon gift card',
        time: new Date().toISOString(),
        is_read: false,
        action: '/my-trades',
        icon: 'trade'
      },
      {
        id: '2',
        type: 'support',
        title: 'Support Alert',
        message: 'Your dispute has been reviewed',
        time: new Date(Date.now() - 3600000).toISOString(),
        is_read: false,
        action: '/disputes',
        icon: 'support'
      },
      {
        id: '3',
        type: 'update',
        title: 'Platform Update',
        message: 'New features available! 0.5% fee now active',
        time: new Date(Date.now() - 7200000).toISOString(),
        is_read: true,
        action: '/announcements',
        icon: 'update'
      }
    ];
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.action) {
      navigate(notification.action);
    }
    setShowDropdown(false);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'trade':
        return <MessageCircle size={18} className="text-blue-500" />;
      case 'support':
        return <Shield size={18} className="text-red-500" />;
      case 'moderator':
        return <Users size={18} className="text-purple-500" />;
      case 'update':
        return <Megaphone size={18} className="text-green-500" />;
      case 'alert':
        return <AlertCircle size={18} className="text-orange-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg transition hover:bg-gray-100"
      >
        <Bell size={20} style={{ color: PRAQEN.primary }} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse"
            style={{ backgroundColor: '#ef4444' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100" style={{ backgroundColor: PRAQEN.lightBg }}>
            <div className="flex items-center gap-2">
              <Bell size={18} style={{ color: PRAQEN.primary }} />
              <h3 className="font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: PRAQEN.primary }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold hover:underline"
                style={{ color: PRAQEN.primary }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: PRAQEN.primary, borderTopColor: 'transparent' }}></div>
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-3 opacity-30" style={{ color: PRAQEN.primary }} />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">We'll notify you when something arrives</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 border-b border-gray-100 transition hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400">{formatTime(notification.time)}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: PRAQEN.primary }}></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 text-center" style={{ backgroundColor: PRAQEN.lightBg }}>
            <button
              onClick={() => {
                setShowDropdown(false);
                navigate('/notifications');
              }}
              className="text-xs font-semibold hover:underline"
              style={{ color: PRAQEN.primary }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}