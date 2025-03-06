import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook to ensure storage buckets exist automatically
 * Can be called during component initialization or before upload operations
 */
export function useEnsureBuckets() {
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<{
    initialized: boolean;
    exists: boolean;
    error?: string;
  }>({
    initialized: false,
    exists: false,
  });
  const { toast } = useToast();

  /**
   * Check and ensure buckets exist
   * @param {boolean} silent - If true, don't show toasts for success (still shows for errors)
   * @returns {Promise<boolean>} - Whether buckets exist or were created successfully
   */
  const ensureBuckets = useCallback(async (silent: boolean = false): Promise<boolean> => {
    if (isEnsuring) return false;
    
    try {
      setIsEnsuring(true);
      
      // Call our API endpoint
      const response = await fetch('/api/storage/ensure-buckets');
      const data = await response.json();
      
      // Set our status based on the response
      const success = response.ok && data.success;
      
      setBucketStatus({
        initialized: true,
        exists: success,
        error: success ? undefined : (data.error || 'Unknown error'),
      });
      
      // Show appropriate toasts
      if (!success) {
        console.error('Error ensuring buckets exist:', data);
        toast({
          title: 'Storage Setup Error',
          description: 'Failed to set up required storage. Image uploads may not work.',
          variant: 'destructive',
        });
      } else if (!silent) {
        toast({
          title: 'Storage Ready',
          description: 'Storage buckets are configured and ready for image uploads.',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error in useEnsureBuckets hook:', error);
      setBucketStatus({
        initialized: true,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      toast({
        title: 'Storage Setup Error',
        description: 'Failed to set up required storage. Image uploads may not work.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsEnsuring(false);
    }
  }, [isEnsuring, toast]);

  // Automatically check buckets once when the hook is first used
  useEffect(() => {
    if (!bucketStatus.initialized) {
      ensureBuckets(true).catch(console.error);
    }
  }, [bucketStatus.initialized, ensureBuckets]);

  return {
    ensureBuckets,
    isEnsuring,
    bucketStatus,
  };
} 