import { ref, computed, watch } from 'vue';
import { useChatStore } from '../stores/chatStore';
import { useAIStore } from '../stores/aiStore';
import { useUIStore } from '../stores/uiStore';

export function useChat(projectId = null) {
  const chatStore = useChatStore();
  const aiStore = useAIStore();
  const uiStore = useUIStore();
  
  // Reactive references
  const isStreaming = ref(false);
  const streamingContent = ref('');
  const loadingMessage = ref('Thinking...');
  const messageQueue = ref([]);
  const responseStartTime = ref(null);
  
  // Computed properties
  const activeProvider = computed(() => aiStore.activeProvider);
  const activeModel = computed(() => aiStore.activeModel);
  const activeMessages = computed(() => chatStore.activeMessages);
  const activeConversation = computed(() => chatStore.activeConversation);
  const autoApplyCode = computed(() => chatStore.autoApplyCode);
  const tokenCounts = computed(() => chatStore.tokenCounts);
  const responseTime = computed(() => chatStore.responseTime);
  
  // Check if conversation exists or create one
  const ensureConversation = () => {
    if (!chatStore.activeConversationId) {
      chatStore.createConversation(projectId);
    }
  };
  
  // Add a user message to the conversation
  const addUserMessage = async (content, attachments = []) => {
    ensureConversation();
    
    // Create message object
    const message = {
      role: 'user',
      content,
      attachments: attachments.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        // In a real implementation, we'd store or upload the file here
        path: file.path || null
      }))
    };
    
    // Add to store
    return chatStore.addMessage(message);
  };
  
  // Add an assistant message to the conversation
  const addAssistantMessage = async (content, options = {}) => {
    ensureConversation();
    
    // Create message object
    const message = {
      role: 'assistant',
      content,
      ...options
    };
    
    // Add to store
    return chatStore.addMessage(message);
  };
  
  // Send a message to the AI provider
  const sendMessage = async (content, attachments = []) => {
    try {
      // Add user message to conversation
      const userMessage = await addUserMessage(content, attachments);
      
      // Show loading indicator
      isStreaming.value = true;
      streamingContent.value = '';
      loadingMessage.value = 'Generating response...';
      chatStore.setStreaming(true);
      responseStartTime.value = Date.now();
      
      // Create a placeholder message for streaming
      const placeholderId = await addAssistantMessage('', { 
        streaming: true 
      });
      
      // Get the provider and model information
      const provider = activeProvider.value;
      const model = activeModel.value;
      
      // Prepare the messages for the API
      const messagesToSend = activeMessages.value
        .filter(msg => msg.id !== placeholderId.id) // Exclude the placeholder
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add system message if configured
      if (aiStore.settings.systemPrompt) {
        messagesToSend.unshift({
          role: 'system',
          content: aiStore.settings.systemPrompt
        });
      }
      
      try {
        // This would typically use the Electron IPC to communicate with the main process
        // where the actual AI provider communication happens
        const response = await window.electronAPI.sendChatMessage({
          providerId: provider.id,
          modelId: model.id,
          messages: messagesToSend,
          options: {
            temperature: aiStore.settings.temperature,
            topP: aiStore.settings.topP,
            maxTokens: aiStore.settings.maxTokens,
            stream: aiStore.settings.streamResponses
          }
        });
        
        if (aiStore.settings.streamResponses) {
          // This is a placeholder for streaming implementation
          // In a real implementation, we'd receive events from the main process
          
          // Setup event handler for streaming
          window.electronAPI.onChatMessageStream((event, chunk) => {
            // Update streaming content
            streamingContent.value += chunk.content;
            
            // Update the placeholder message
            chatStore.updateMessage(placeholderId.id, {
              content: streamingContent.value
            });
            
            // Update token counts
            if (chunk.usage) {
              chatStore.updateTokenCounts({
                input: chunk.usage.promptTokens || 0,
                output: chunk.usage.completionTokens || 0,
                cost: chunk.usage.cost || 0
              });
            }
          });
          
          // Setup event handler for end of stream
          window.electronAPI.onChatMessageStreamEnd((event, result) => {
            // Finalize message
            chatStore.updateMessage(placeholderId.id, {
              content: streamingContent.value || result.content,
              streaming: false,
              type: result.type || 'text',
              language: result.language || null
            });
            
            // Update token counts and timing
            chatStore.updateTokenCounts({
              input: result.usage?.promptTokens || 0,
              output: result.usage?.completionTokens || 0,
              cost: result.usage?.cost || 0
            });
            
            const endTime = Date.now();
            chatStore.setResponseTime(endTime - responseStartTime.value);
            
            // Reset streaming state
            isStreaming.value = false;
            streamingContent.value = '';
            chatStore.setStreaming(false);
            
            // Auto-apply code if enabled
            if (autoApplyCode.value && result.type === 'code') {
              applyCode(placeholderId.id);
            }
          });
        } else {
          // Non-streaming response
          chatStore.updateMessage(placeholderId.id, {
            content: response.content,
            streaming: false,
            type: response.type || 'text',
            language: response.language || null
          });
          
          // Update token counts and timing
          chatStore.updateTokenCounts({
            input: response.usage?.promptTokens || 0,
            output: response.usage?.completionTokens || 0,
            cost: response.usage?.cost || 0
          });
          
          const endTime = Date.now();
          chatStore.setResponseTime(endTime - responseStartTime.value);
          
          // Reset streaming state
          isStreaming.value = false;
          chatStore.setStreaming(false);
          
          // Auto-apply code if enabled
          if (autoApplyCode.value && response.type === 'code') {
            applyCode(placeholderId.id);
          }
        }
        
        return placeholderId.id;
      } catch (error) {
        // Update placeholder message with error
        chatStore.updateMessage(placeholderId.id, {
          content: `Error: ${error.message || 'Failed to generate response'}`,
          streaming: false,
          type: 'error'
        });
        
        // Reset streaming state
        isStreaming.value = false;
        chatStore.setStreaming(false);
        
        // Show error notification
        uiStore.addNotification({
          type: 'error',
          title: 'AI Error',
          message: error.message || 'Failed to generate response'
        });
        
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error notification
      uiStore.addNotification({
        type: 'error',
        title: 'Chat Error',
        message: error.message || 'Failed to send message'
      });
      
      throw error;
    }
  };
  
  // Cancel ongoing AI request
  const cancelRequest = async () => {
    try {
      // This would typically use the Electron IPC to communicate with the main process
      await window.electronAPI.cancelChatMessage();
      
      // Reset streaming state
      isStreaming.value = false;
      streamingContent.value = '';
      chatStore.setStreaming(false);
      
      // Update last message if it was streaming
      const messages = chatStore.activeMessages;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.streaming) {
        chatStore.updateMessage(lastMessage.id, {
          content: lastMessage.content + ' [cancelled]',
          streaming: false
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling request:', error);
      return false;
    }
  };
  
  // Clear chat history
  const clearChat = () => {
    chatStore.clearConversation();
  };
  
  // Apply code from a message
  const applyCode = async (messageId) => {
    const message = activeMessages.value.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant' || message.type !== 'code') {
      return false;
    }
    
    try {
      // This would typically use the Electron IPC to apply the code to the editor
      const result = await window.electronAPI.applyCode({
        code: message.content,
        language: message.language,
        projectId: activeConversation.value.projectId
      });
      
      if (result.success) {
        uiStore.addNotification({
          type: 'success',
          title: 'Code Applied',
          message: 'Code was successfully applied to the editor'
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to apply code');
      }
    } catch (error) {
      console.error('Error applying code:', error);
      
      uiStore.addNotification({
        type: 'error',
        title: 'Code Application Failed',
        message: error.message || 'Failed to apply code to the editor'
      });
      
      return false;
    }
  };
  
  // Handle file attachments
  const handleAttachment = async (callback) => {
    try {
      // This would typically use the Electron IPC to open a file picker
      const result = await window.electronAPI.selectFiles({
        multiple: true,
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result.success && result.files && result.files.length > 0) {
        callback(result.files);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      
      uiStore.addNotification({
        type: 'error',
        title: 'File Selection Failed',
        message: error.message || 'Failed to select files'
      });
    }
  };
  
  // Toggle auto-apply code setting
  const toggleAutoApplyCode = () => {
    chatStore.setAutoApplyCode(!autoApplyCode.value);
  };

  return {
    // State
    isStreaming,
    loadingMessage,
    activeProvider,
    activeModel,
    activeMessages,
    activeConversation,
    autoApplyCode,
    tokenCounts,
    responseTime,
    
    // Actions
    sendMessage,
    cancelRequest,
    clearChat,
    applyCode,
    handleAttachment,
    toggleAutoApplyCode
  };
}