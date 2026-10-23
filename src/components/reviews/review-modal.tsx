'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2, Sparkles, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { createReviewAction } from '@/actions/review.actions';

interface ReviewModalProps {
  appointmentId: string;
  doctorName: string;
  departmentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Unsatisfactory',
  2: 'Fair / Needs Improvement',
  3: 'Good / Met Expectations',
  4: 'Very Good / High Quality',
  5: 'Exceptional Healthcare Experience',
};

export function ReviewModal({
  appointmentId,
  doctorName,
  departmentName,
  open,
  onOpenChange,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = React.useState<number>(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [waitRating, setWaitRating] = React.useState<number>(5);
  const [mannerRating, setMannerRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const activeRating = hoverRating || rating;

  const handleSubmit = async () => {
    if (!comment.trim() || comment.length < 5) {
      toast.error('Please share at least a short sentence (5+ characters) about your visit.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createReviewAction({
        appointmentId,
        rating,
        waitDurationRating: waitRating,
        bedsideMannerRating: mannerRating,
        comment: comment.trim(),
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to submit review');
        return;
      }

      toast.success('Thank you! Your verified review has been submitted for moderation.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <MessageSquareHeart className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Review Your Consultation</DialogTitle>
              <DialogDescription className="text-xs">
                Dr. {doctorName} {departmentName ? `• ${departmentName}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Star Rating Selector */}
          <div className="text-center space-y-2 py-2 bg-muted/30 rounded-2xl border border-border/50">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Overall Patient Care Rating
            </Label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`${star} star`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= activeRating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {RATING_LABELS[activeRating]}
            </p>
          </div>

          {/* Sub-Ratings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/20 rounded-xl border space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Wait Time & Punctuality
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setWaitRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= waitRating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-muted/20 rounded-xl border space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Bedside Manner & Empathy
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMannerRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= mannerRating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Share Your Healthcare Experience
            </Label>
            <Textarea
              placeholder="Describe your appointment, the clarity of explanations, treatment plan, and overall clinic care..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-24 text-xs resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
              <span>All reviews are moderated for patient privacy (HIPAA compliant).</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Submit Verified Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
