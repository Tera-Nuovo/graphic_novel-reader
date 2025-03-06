import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { requiredBuckets } from '@/lib/storage-utils';

/**
 * A button component that when clicked triggers the creation of required storage buckets
 */
export function CreateBucketsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleCreateBuckets = async () => {
    try {
      setIsLoading(true);
      setSuccess(false);

      const response = await fetch('/api/storage/create-buckets', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create buckets: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Bucket creation response:', data);

      // Check if all buckets were successfully created
      const failedBuckets = data.results
        .filter((r: { success: boolean }) => !r.success)
        .map((r: { bucket: string }) => r.bucket);
      
      if (failedBuckets.length > 0) {
        toast({
          title: 'Some buckets could not be created',
          description: `Failed to create: ${failedBuckets.join(', ')}. Please try again or check console for details.`,
          variant: 'destructive',
        });
      } else {
        setSuccess(true);
        toast({
          title: 'Storage buckets created',
          description: `Successfully created or verified all required buckets: ${requiredBuckets.join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Error creating buckets:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create storage buckets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateBuckets}
      disabled={isLoading || success}
      variant={success ? "outline" : "default"}
      className="gap-2"
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {success ? 
        'Buckets Created Successfully' : 
        (isLoading ? 'Creating Buckets...' : 'Create Storage Buckets')}
    </Button>
  );
} 