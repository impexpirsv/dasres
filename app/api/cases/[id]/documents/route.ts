import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!caseId || Number.isNaN(caseId)) {
      return Response.json(
        { message: "Invalid case id" },
        { status: 400 }
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
          include: {
            company: true,
          },
        },
      },
    });

    if (!tradeCase) {
      return Response.json(
        { message: "Case not found" },
        { status: 404 }
      );
    }

    if (tradeCase.status !== "IN_PROGRESS") {
      return Response.json(
        {
          message:
            "Documents can only be uploaded for in-progress cases.",
        },
        { status: 400 }
      );
    }

    const acceptedProposal = tradeCase.proposals[0];

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;
    const acceptedProviderUserId =
      acceptedProposal?.company?.ownerId || null;

    const isAcceptedProvider =
      acceptedProviderUserId === user.id;

    if (!isAdmin && !isCustomer && !isAcceptedProvider) {
      return Response.json(
        {
          message:
            "You are not allowed to upload documents for this case.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { message: "File is required" },
        { status: 400 }
      );
    }
const MAX_FILE_SIZE = 10 * 1024 * 1024;

if (file.size > MAX_FILE_SIZE) {
  return Response.json(
    {
      message:
        "Maximum file size is 10MB.",
    },
    { status: 400 }
  );
}
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
];

if (!ALLOWED_FILE_TYPES.includes(file.type)) {
  return Response.json(
    {
      message:
        "Only PDF, Word, Excel, JPG, PNG and WEBP files are allowed.",
    },
    { status: 400 }
  );
}
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "cases"
    );

    await mkdir(uploadDir, { recursive: true });

    const safeFileName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );

    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/cases/${fileName}`;

    await prisma.$transaction(async (tx) => {
      await tx.caseDocument.create({
        data: {
          caseId,
          uploaderId: user.id,
          name: file.name,
          fileUrl,
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

      await Promise.all(
        Array.from(receiverIds).map((receiverId) =>
          tx.notification.create({
            data: {
              userId: receiverId,
              title: "New case document",
              message: `${
                user.name || user.email
              } uploaded a document in case: ${
                tradeCase.title
              }`,
              type: "CASE_DOCUMENT",
              link: `/dashboard/cases/${tradeCase.id}`,
            },
          })
        )
      );
    });

    return Response.json({
      message: "Document uploaded",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to upload document" },
      { status: 500 }
    );
  }
}