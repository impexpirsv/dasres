import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let savedFilePath: string | null = null;

  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!Number.isInteger(caseId) || caseId <= 0) {
      return Response.json(
        {
          code: "INVALID_CASE_ID",
        },
        { status: 400 },
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
      include: {
        proposals: {
          where: {
            status: "ACCEPTED",
          },
          select: {
            company: {
              select: {
                ownerId: true,
              },
            },
            expert: {
              select: {
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!tradeCase) {
      return Response.json(
        {
          code: "CASE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (tradeCase.status !== "IN_PROGRESS") {
      return Response.json(
        {
          code: "CASE_NOT_IN_PROGRESS",
        },
        { status: 400 },
      );
    }

    const acceptedProposal = tradeCase.proposals[0];

    const acceptedProviderUserId =
      acceptedProposal?.company?.ownerId ??
      acceptedProposal?.expert?.ownerId ??
      null;

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;
    const isAcceptedProvider =
      acceptedProviderUserId === user.id;

    if (!isAdmin && !isCustomer && !isAcceptedProvider) {
      return Response.json(
        {
          code: "CASE_DOCUMENT_UPLOAD_ACCESS_DENIED",
        },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return Response.json(
        {
          code: "FILE_REQUIRED",
        },
        { status: 400 },
      );
    }

    const file = fileValue;

    if (file.size <= 0) {
      return Response.json(
        {
          code: "EMPTY_FILE_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          code: "FILE_TOO_LARGE",
          maxSizeBytes: MAX_FILE_SIZE,
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return Response.json(
        {
          code: "UNSUPPORTED_FILE_TYPE",
        },
        { status: 400 },
      );
    }

    const originalFileName = path.basename(file.name).trim();

    if (!originalFileName) {
      return Response.json(
        {
          code: "INVALID_FILE_NAME",
        },
        { status: 400 },
      );
    }

    const safeFileName = originalFileName
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+/, "");

    if (!safeFileName) {
      return Response.json(
        {
          code: "INVALID_FILE_NAME",
        },
        { status: 400 },
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "cases",
    );

    await mkdir(uploadDir, { recursive: true });

    const storedFileName = `${Date.now()}-${randomUUID()}-${safeFileName}`;
    savedFilePath = path.join(uploadDir, storedFileName);

    const bytes = await file.arrayBuffer();
    await writeFile(savedFilePath, Buffer.from(bytes));

    const fileUrl = `/uploads/cases/${storedFileName}`;

    const document = await prisma.$transaction(async (tx) => {
      const createdDocument = await tx.caseDocument.create({
        data: {
          caseId,
          uploaderId: user.id,
          name: originalFileName,
          fileUrl,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId,
          userId: user.id,
          action: "DOCUMENT_UPLOADED",
          details: `${user.name ?? user.email} uploaded document: ${originalFileName}`,
        },
      });

      const receiverIds = new Set<number>();

      if (tradeCase.customerId !== user.id) {
        receiverIds.add(tradeCase.customerId);
      }

      if (
        acceptedProviderUserId &&
        acceptedProviderUserId !== user.id
      ) {
        receiverIds.add(acceptedProviderUserId);
      }

      if (receiverIds.size > 0) {
        await tx.notification.createMany({
          data: Array.from(receiverIds).map((receiverId) => ({
            userId: receiverId,
            title: "New case document",
            message: `${
              user.name ?? user.email
            } uploaded a document in case: ${tradeCase.title}`,
            type: "CASE_DOCUMENT",
            link: `/dashboard/cases/${tradeCase.id}`,
          })),
        });
      }

      return createdDocument;
    });

    savedFilePath = null;

    return Response.json(
      {
        code: "CASE_DOCUMENT_UPLOADED",
        document,
      },
      { status: 201 },
    );
  } catch (error) {
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch {
        // فایل ممکن است قبلاً حذف شده باشد.
      }
    }

    console.error("CASE_DOCUMENT_UPLOAD_FAILED", error);

    return Response.json(
      {
        code: "CASE_DOCUMENT_UPLOAD_FAILED",
      },
      { status: 500 },
    );
  }
}