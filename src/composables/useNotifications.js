import { ref, computed } from 'vue';
import { useUIStore } from '../stores/uiStore';

export function useNotifications() {
  const uiStore = useUIStore();
  
  // Reference to the Toast component instance
  const toastRef = ref(null);
  
  // Computed properties
  const notifications = computed(() => uiStore.notifications);
  const currentNotification = computed(() => uiStore.currentNotification);
  const hasPendingNotifications = computed(() => uiStore.hasPendingNotifications);
  
  /**
   * Show a notification toast
   * 
   * @param {Object} options - Notification options
   * @param {string} options.type - Notification type ('info', 'success', 'warning', 'error')
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message content
   * @param {number} options.duration - Duration in ms (0 for no auto-dismiss)
   * @returns {string} Notification ID
   */
  const notify = (options) => {
    const id = uiStore.addNotification(options);
    
    // If we have a direct reference to the Toast component, use it
    if (toastRef.value) {
      toastRef.value.addToast({
        id,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        duration: options.duration
      });
    }
    
    return id;
  };
  
  /**
   * Show an info notification
   * 
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  const info = (message, title = 'Info', duration = 5000) => {
    return notify({
      type: 'info',
      title,
      message,
      duration
    });
  };
  
  /**
   * Show a success notification
   * 
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  const success = (message, title = 'Success', duration = 5000) => {
    return notify({
      type: 'success',
      title,
      message,
      duration
    });
  };
  
  /**
   * Show a warning notification
   * 
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  const warning = (message, title = 'Warning', duration = 5000) => {
    return notify({
      type: 'warning',
      title,
      message,
      duration
    });
  };
  
  /**
   * Show an error notification
   * 
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  const error = (message, title = 'Error', duration = 8000) => {
    return notify({
      type: 'error',
      title,
      message,
      duration
    });
  };
  
  /**
   * Remove a notification by ID
   * 
   * @param {string} id - Notification ID
   * @returns {boolean} Whether the notification was successfully removed
   */
  const remove = (id) => {
    // If we have a direct reference to the Toast component, use it
    if (toastRef.value) {
      toastRef.value.removeToast(id);
    }
    
    return uiStore.removeNotification(id);
  };
  
  /**
   * Clear all notifications
   */
  const clearAll = () => {
    uiStore.clearNotifications();
  };
  
  /**
   * Show a confirmation dialog
   * 
   * @param {Object} options - Dialog options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.confirmLabel - Confirm button label
   * @param {string} options.cancelLabel - Cancel button label
   * @param {Function} options.onConfirm - Callback when confirmed
   * @param {Function} options.onCancel - Callback when cancelled
   */
  const confirm = ({ 
    title = 'Confirm', 
    message = 'Are you sure?', 
    confirmLabel = 'Confirm', 
    cancelLabel = 'Cancel',
    onConfirm = null,
    onCancel = null
  }) => {
    uiStore.showConfirmDialog({
      title,
      message,
      confirmLabel,
      cancelLabel,
      confirmAction: onConfirm,
      cancelAction: onCancel
    });
  };
  
  /**
   * Handle errors and show appropriate notifications
   * 
   * @param {Error|string} err - Error object or message
   * @param {string} title - Error notification title
   * @param {boolean} rethrow - Whether to rethrow the error
   */
  const handleError = (err, title = 'Error', rethrow = false) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    error(errorMessage, title);
    console.error(err);
    
    if (rethrow) {
      throw err;
    }
  };
  
  /**
   * Set the Toast component reference
   * 
   * @param {Object} ref - Reference to the Toast component
   */
  const setToastRef = (ref) => {
    toastRef.value = ref;
  };
  
  return {
    // State
    notifications,
    currentNotification,
    hasPendingNotifications,
    toastRef,
    
    // Methods
    notify,
    info,
    success,
    warning,
    error,
    remove,
    clearAll,
    confirm,
    handleError,
    setToastRef
  };
}