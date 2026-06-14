import { Card, CardContent } from "@/components/ui/card";
import { ReviewCard } from "@/components/reviews/review-card";
import { StarRating } from "@/components/reviews/star-rating";
import { getReviews, getReviewStats } from "@/lib/actions/reviews";

export default async function AdminReviewsPage() {
  const [reviews, stats] = await Promise.all([getReviews(100), getReviewStats()]);

  const likedFirst = [...reviews].sort((a, b) => {
    if (a.admin_liked !== b.admin_liked) return a.admin_liked ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">User Reviews</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Like standout reviews or remove inappropriate ones
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.count}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.average || "—"}</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{reviews.filter((r) => r.admin_liked).length}</p>
            <p className="text-xs text-muted-foreground">Liked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-1">
            {stats.average > 0 ? (
              <StarRating value={Math.round(stats.average)} readonly size="sm" />
            ) : (
              <p className="text-2xl font-bold">—</p>
            )}
            <p className="text-xs text-muted-foreground">Stars</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {likedFirst.length > 0 ? (
          likedFirst.map((review) => (
            <ReviewCard key={review.id} review={review} isAdmin />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No reviews yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
