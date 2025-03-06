import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook to ensure storage buckets exist and have proper policies configured
 * Can be called during component initialization or before upload operations
 */
export function useEnsureBuckets() {
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<{
    initialized: boolean;
    exists: boolean;
    policiesConfigured: boolean;
    error?: string;
  }>({
    initialized: false,
    exists: false,
    policiesConfigured: false,
  });
  const { toast } = useToast();

  /**
   * Check and ensure buckets exist and have proper policies
   * @param {boolean} silent - If true, don't show toasts for success (still shows for errors)
   * @returns {Promise<boolean>} - Whether buckets exist and policies are configured
   */
  const ensureBuckets = useCallback(async (silent: boolean = false): Promise<boolean> => {
    if (isEnsuring) return false;
    
    try {
      setIsEnsuring(true);
      
      // Step 1: Ensure buckets exist
      console.log('Ensuring buckets exist...');
      const response = await fetch('/api/storage/ensure-buckets');
      const data = await response.json();
      
      // Step 2: Configure bucket policies
      console.log('Configuring bucket policies...');
      const policiesResponse = await fetch('/api/storage/configure-policies');
      const policiesData = await policiesResponse.json();
      
      // Set our status based on the responses
      const success = response.ok && data.success && policiesResponse.ok && policiesData.success;
      
      setBucketStatus({
        initialized: true,
        exists: response.ok && data.success,
        policiesConfigured: policiesResponse.ok && policiesData.success,
        error: success ? undefined : 
          (!response.ok || !data.success ? 
            (data.error || 'Unknown error creating buckets') : 
            (policiesData.error || 'Unknown error configuring bucket policies')),
      });
      
      // Show appropriate toasts
      if (!success) {
        console.error('Error ensuring storage is ready:', { buckets: data, policies: policiesData });
        toast({
          title: 'Storage Setup Error',
          description: 'Failed to set up required storage permissions. Image uploads may not work.',
          variant: 'destructive',
        });
      } else if (!silent) {
        toast({
          title: 'Storage Ready',
          description: 'Storage is configured and ready for image uploads.',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error in useEnsureBuckets hook:', error);
      setBucketStatus({
        initialized: true,
        exists: false,
        policiesConfigured: false,
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

  // Automatically check buckets and policies once when the hook is first used
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