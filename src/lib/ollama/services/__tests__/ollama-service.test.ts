import { DEFAULT_CONFIG } from '../../types';
import { OllamaService } from '../ollama-service';

// Mock fetch
global.fetch = jest.fn();

describe('OllamaService', () => {
  let service: OllamaService;

  beforeEach(() => {
    service = new OllamaService();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(service['config']).toEqual(DEFAULT_CONFIG);
    });

    it('should override default config with provided values', () => {
      const customConfig = {
        baseUrl: 'http://custom-url:11434',
        defaultModel: 'custom-model',
      };
      const customService = new OllamaService(customConfig);
      expect(customService['config']).toEqual({
        ...DEFAULT_CONFIG,
        ...customConfig,
      });
    });
  });

  describe('updateConfig', () => {
    it('should update config with partial values', () => {
      const newConfig = {
        baseUrl: 'http://new-url:11434',
      };
      service.updateConfig(newConfig);
      expect(service['config']).toEqual({
        ...DEFAULT_CONFIG,
        ...newConfig,
      });
    });
  });

  describe('checkConnection', () => {
    it('should return true on successful connection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.checkConnection();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.any(Object),
      );
    });

    it('should return false on failed connection', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await service.checkConnection();
      expect(result).toBe(false);
    });
  });

  describe('listModels', () => {
    it('should return list of models on success', async () => {
      const mockModels = ['model1', 'model2'];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: mockModels.map(name => ({ name })) }),
      });

      const result = await service.listModels();
      expect(result).toEqual(mockModels);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tags'),
        expect.any(Object),
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch models' }),
      });

      await expect(service.listModels()).rejects.toThrow('Failed to fetch models');
    });
  });

  describe('chatWithTools', () => {
    it('should handle streaming responses', async () => {
      const mockResponse = {
        model: 'test-model',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'test response',
        },
        done: true,
      };

      // Mock EventSource
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      global.EventSource = jest.fn().mockImplementation(() => mockEventSource);

      // Mock fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const onMessage = jest.fn();
      const request = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }],
        tools: [],
      };

      const promise = service.chatWithTools(request, onMessage);

      // Simulate message event
      mockEventSource.onmessage({
        data: JSON.stringify(mockResponse),
      });

      await promise;

      expect(onMessage).toHaveBeenCalledWith(mockResponse);
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should handle errors in streaming', async () => {
      const mockError = { error: 'Test error' };

      // Mock EventSource
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      global.EventSource = jest.fn().mockImplementation(() => mockEventSource);

      // Mock fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const onMessage = jest.fn();
      const request = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }],
        tools: [],
      };

      const promise = service.chatWithTools(request, onMessage);

      // Simulate error event
      mockEventSource.onmessage({
        data: JSON.stringify(mockError),
      });

      await expect(promise).rejects.toThrow('Test error');
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });
});
