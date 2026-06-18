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
if (tradeCase.status === "COMPLETED") {
  return Response.json(
    {
      message: "Completed cases are read-only.",
    },
    { status: 400 }
  );
}
    const acceptedProposal = tradeCase.proposals[0];

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;
    const isAcceptedProvider =
      acceptedProposal?.company?.ownerId === user.id;

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

    await prisma.caseDocument.create({
      data: {
        caseId,
        uploaderId: user.id,
        name: file.name,
        fileUrl,
      },
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