import { inspectorPrisma } from "@/lib/db";
import { parseDBParams } from "@duckarchive/framework";
import { chunk } from "lodash";
import { NextRequest, NextResponse } from "next/server";

const FAMILY_SEARCH_RESOURCE_ID = "e106fff5-12bd-4023-bbf6-fbf58faaf1b7";

export async function POST() {
  try {
    const allOnlineCopies = await inspectorPrisma.caseOnlineCopy.findMany({
      where: {
        resource_id: FAMILY_SEARCH_RESOURCE_ID,
      },
    });

    const decoded = allOnlineCopies.map((copy) => {
      const params = parseDBParams(copy.api_params);
      return { ...copy, api_params_temp: params };
    });

    const chunks = chunk(decoded, 500);

    for (const chunkItems of chunks) {
      const createPromises = chunkItems.map((item) =>
        inspectorPrisma.caseOnlineCopy.update({
          where: {
            resource_id_case_id_api_params: {
              resource_id: FAMILY_SEARCH_RESOURCE_ID,
              case_id: item.case_id,
              api_params: item.api_params,
            },
          },
          data: item,
        })
      );

      await Promise.all(createPromises);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FS Import Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
