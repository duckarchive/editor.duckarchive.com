import { NextRequest, NextResponse } from "next/server";
import { inspectorPrisma } from "@/lib/db";
import { Author } from "@/generated/prisma/inspector-client";

export async function POST(request: NextRequest) {
  try {
    const { target, toDelete }: { target: Author; toDelete: string[] } =
      await request.json();

    if (!target || !toDelete || toDelete.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await inspectorPrisma.$transaction(async (prisma) => {
      // 1. Find all case-author relations for the authors to be deleted.
      const caseAuthorsToDelete = await prisma.caseAuthor.findMany({
        where: { author_id: { in: toDelete } },
      });

      // 2. Find all case-author relations for the target author.
      const targetCaseAuthors = await prisma.caseAuthor.findMany({
        where: { author_id: target.id },
      });
      const targetCaseIds = new Set(targetCaseAuthors.map((ca) => ca.case_id));

      // 3. Identify which relations to update and which to delete to avoid conflicts.
      const caseAuthorsToUpdate = [];
      const caseAuthorsToRemove = [];

      for (const ca of caseAuthorsToDelete) {
        if (targetCaseIds.has(ca.case_id)) {
          // This case is already linked to the target author, so this link is redundant.
          caseAuthorsToRemove.push(ca);
        } else {
          // This case is not yet linked to the target author, so we can update it.
          caseAuthorsToUpdate.push(ca);
          // Add to set to handle cases where multiple authors to be deleted are linked to the same case.
          targetCaseIds.add(ca.case_id);
        }
      }

      // 4. Delete the redundant case-author links.
      if (caseAuthorsToRemove.length > 0) {
        await prisma.caseAuthor.deleteMany({
          where: {
            OR: caseAuthorsToRemove.map((ca) => ({
              case_id: ca.case_id,
              author_id: ca.author_id,
            })),
          },
        });
      }

      // 5. Update the remaining case-author links to point to the target author.
      if (caseAuthorsToUpdate.length > 0) {
        const caseIdsToUpdate = caseAuthorsToUpdate.map((ca) => ca.case_id);
        await prisma.caseAuthor.updateMany({
          where: {
            case_id: { in: caseIdsToUpdate },
            author_id: { in: toDelete },
          },
          data: {
            author_id: target.id,
          },
        });
      }

      // 6. Update the target author with the merged data
      const updatedAuthor = await prisma.author.update({
        where: { id: target.id },
        data: {
          title: target.title,
          info: target.info,
          lat: target.lat,
          lng: target.lng,
          tags: target.tags,
        },
      });

      // 7. Delete the other authors
      await prisma.author.deleteMany({
        where: {
          id: {
            in: toDelete,
          },
        },
      });

      return updatedAuthor;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Merge authors error:", error);
    return NextResponse.json(
      { error: "Failed to merge authors" },
      { status: 500 }
    );
  }
}
