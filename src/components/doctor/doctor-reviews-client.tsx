'use client';

import * as React from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Award,
  Clock,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DoctorReviewsResult } from '@/actions/review.actions';

interface DoctorReviewsClientProps {
  data: DoctorReviewsResult;
}

export function DoctorReviewsClient({ data }: DoctorReviewsClientProps) {
  const { reviews, stats } = data;
  const { averageRating, reviewCount, distribution } = stats;

  const fiveStarCount = distribution[5] || 0;
  const fiveStarPercent = reviewCount > 0 ? Math.round((fiveStarCount / reviewCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          Patient Reviews & Clinical Reputation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect patient satisfaction feedback, verified testimonials, and bedside manner sentiment scores.
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-medium">Aggregate Rating</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-foreground">
              {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
            </span>
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(averageRating || 5)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Based on {reviewCount} verified patient consultation{reviewCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-medium">Verified Reviews</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-foreground">{reviewCount}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              100% HIPAA Verified
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Published after clinical moderation
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-medium">5-Star Experience Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
              {fiveStarPercent}%
            </span>
            <ThumbsUp className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {fiveStarCount} patients awarded highest rating
          </p>
        </div>
      </div>

      {/* Star Distribution Visualizer */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Rating Breakdown & Distribution
        </h3>

        <div className="space-y-2.5 max-w-xl">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-medium text-muted-foreground flex items-center gap-1">
                  {stars} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                </span>
                <Progress value={percent} className="h-2 flex-1" />
                <span className="w-14 text-right font-mono text-muted-foreground">
                  {count} ({Math.round(percent)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-teal-600" />
          Patient Testimonials ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center bg-card">
            <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <h4 className="text-sm font-semibold text-foreground">No patient reviews yet</h4>
            <p className="text-xs text-muted-foreground mt-1">
              As patients conclude outpatient encounters, their reviews will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              const patientUser = rev.patientId?.userId;
              const patientName = patientUser?.name || 'Verified Patient';
              const isApproved = rev.status === 'approved';

              return (
                <div
                  key={rev.id || rev._id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 font-bold text-xs">
                        {patientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-foreground">{patientName}</h4>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={isApproved ? 'secondary' : 'outline'}
                      className={`text-[10px] ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {isApproved ? 'Published' : 'Pending Moderation'}
                    </Badge>
                  </div>

                  {/* Rating Stars & Sub-Scores */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= rev.rating ? 'fill-amber-500' : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>

                    {rev.waitDurationRating && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        Punctuality: {rev.waitDurationRating}/5
                      </span>
                    )}

                    {rev.bedsideMannerRating && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-500" />
                        Bedside Manner: {rev.bedsideMannerRating}/5
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/40 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
