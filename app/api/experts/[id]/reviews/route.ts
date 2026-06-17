import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;
    const expertId = Number(id);

    const body = await request.json();

    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!rating || rating < 1 || rating > 5) {
      return Response.json(
        { message: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    const expert = await prisma.expert.findUnique({
      where: {
        id: expertId,
      },
    });

    if (!expert) {
      return Response.json(
        { message: "Expert not found." },
        { status: 404 }
      );
    }

    if (!expert.ownerId) {
      return Response.json(
        { message: "This expert has no owner." },
        { status: 400 }
      );
    }

    if (expert.ownerId === currentUser.id) {
      return Response.json(
        { message: "You cannot review your own expert profile." },
        { status: 403 }
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: currentUser.id,
        reviewedUserId: expert.ownerId,
      },
    });

    if (existingReview) {
      await prisma.review.update({
        where: {
          id: existingReview.id,
        },
        data: {
          rating,
          comment,
        },
      });
    } else {
      await prisma.review.create({
        data: {
          rating,
          comment,
          reviewerId: currentUser.id,
          reviewedUserId: expert.ownerId,
        },
      });
    }

    return Response.json({
      message: "Review saved.",
    });
  } catch (error) {
    console.error("EXPERT REVIEW ERROR:", error);

    return Response.json(
      { message: "Failed to save review." },
      { status: 500 }
    );
  }
}