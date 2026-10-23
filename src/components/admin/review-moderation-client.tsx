'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Stethoscope,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { moderateReviewAction } from '@/actions/review.actions';

interface ReviewModerationClientProps {
  initialReviews: any[];
}

export function ReviewModerationClient({ initialReviews }: ReviewModerationClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = React.useState<any[]>(initialReviews);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Reject dialog state
  const [rejectingReview, setRejectingReview] = React.useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isSubmittingReject, setIsSubmittingReject] = React.useState(false);

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleApprove = async (reviewId: string) => {
    try {
      setLoadingId(reviewId);
      const res = await moderateReviewAction({
        reviewId,
        status: 'approved',
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to approve review');
        return;
      }

      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, status: 'approved' } : r))
      );
      toast.success(
        `Review approved! Doctor aggregate rating updated to ${res.data?.averageRating} ★.`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error approving review');
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReview) return;
    try {
      setIsSubmittingReject(true);
      const reviewId = rejectingReview._id;
      const res = await moderateReviewAction({
        reviewId,
        status: 'rejected',
        rejectionReason: rejectionReason.trim() || 'Content did not comply with clinical review policy',
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to reject review');
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, status: 'rejected', rejectionReason: rejectionReason.trim() }
            : r
        )
      );
      toast.info('Review rejected and omitted from public doctor profiles.');
      setRejectingReview(null);
      setRejectionReason('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting review');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Patient Reviews Moderation Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review patient satisfaction feedback, protect clinical reputation integrity, and enforce HIPAA compliance standards.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl">
          <Button
            size="sm"
            variant={filter === 'pending' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'approved' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('approved')}
          >
            Approved ({approvedCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'rejected' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('rejected')}
          >
            Rejected ({rejectedCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('all')}
          >
            All ({reviews.length})
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">Pending Moderation</span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">Approved & Live</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{approvedCount}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">Rejected</span>
            <p className="text-2xl font-bold text-destructive mt-0.5">{rejectedCount}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Reviews Feed */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No reviews in this queue view</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === 'pending'
              ? 'All patient reviews have been reviewed and moderated.'
              : 'No patient reviews match the selected filter tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const patientUser = review.patientId?.userId;
            const patientName = patientUser?.name || 'Verified Patient';
            const doctorUser = review.doctorId?.userId;
            const doctorName = doctorUser?.name || 'Physician';
            const departmentName = review.doctorId?.departmentId?.name || 'Clinical Care';
            const isPending = review.status === 'pending';
            const isApproved = review.status === 'approved';
            const isRejected = review.status === 'rejected';

            return (
              <div
                key={review._id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      {patientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{patientName}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          Verified Consultation
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Stethoscope className="h-3 w-3 text-teal-600" />
                        Reviewed <span className="font-semibold text-foreground">Dr. {doctorName}</span> ({departmentName})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {/* Status Badge */}
                    {isPending && (
                      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs gap-1">
                        <Clock className="h-3 w-3" /> Pending Review
                      </Badge>
                    )}
                    {isApproved && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Approved & Public
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs gap-1">
                        <XCircle className="h-3 w-3" /> Rejected
                      </Badge>
                    )}

                    <span className="text-[11px] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Rating Stars & Sub-Scores */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= review.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-amber-700 dark:text-amber-400 ml-1">
                      {review.rating}.0
                    </span>
                  </div>

                  {review.waitDurationRating && (
                    <div className="text-muted-foreground">
                      Punctuality:{' '}
                      <span className="font-semibold text-foreground">
                        {review.waitDurationRating}/5 ★
                      </span>
                    </div>
                  )}

                  {review.bedsideMannerRating && (
                    <div className="text-muted-foreground">
                      Bedside Manner:{' '}
                      <span className="font-semibold text-foreground">
                        {review.bedsideMannerRating}/5 ★
                      </span>
                    </div>
                  )}
                </div>

                {/* Review Feedback Narrative */}
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border/40 text-xs text-foreground leading-relaxed">
                  "{review.comment}"
                </div>

                {/* Rejection Note if Rejected */}
                {review.rejectionReason && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Rejection Justification: </span>
                      {review.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Moderation Actions for Pending Reviews */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => {
                        setRejectingReview(review);
                        setRejectionReason('');
                      }}
                      disabled={loadingId === review._id}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      onClick={() => handleApprove(review._id)}
                      disabled={loadingId === review._id}
                    >
                      {loadingId === review._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve & Publish
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={Boolean(rejectingReview)} onOpenChange={(open) => !open && setRejectingReview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Reject Patient Review
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a clinical moderation justification for omitting this review from public profiles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="rejection-reason" className="text-xs font-semibold">
              Rejection Reason
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g. Contains protected health information (PHI), inappropriate language, or unverified clinical claims..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs h-24"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectingReview(null)}
              disabled={isSubmittingReject}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isSubmittingReject}
              className="text-xs"
            >
              {isSubmittingReject && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
