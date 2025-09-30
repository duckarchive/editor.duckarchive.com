import { NextRequest, NextResponse } from "next/server";
import { inspectorPrisma } from "@/lib/db";

export interface StructureApplyRequest {
  archive_code?: string;
  fund_code?: string;
  description_code?: string;
  case_code?: string;
}

export interface StructureApplyResponse {
  success: boolean;
  applied: StructureApplyRequest;
  message?: string;
  error?: string;
  ids?: {
    archive_id?: string;
    fund_id?: string;
    description_id?: string;
    case_id?: string;
  };
}

// Shared helper functions
function calculateDeps(body: StructureApplyRequest): number {
  let deps = 1; // Always at least archive
  if (body.fund_code) deps = 2;
  if (body.description_code) deps = 3;
  if (body.case_code) deps = 4;
  return deps;
}

function validateRequiredFields(body: StructureApplyRequest, deps: number): string | null {
  if (!body.archive_code) {
    return "Код архіву обов'язковий";
  }

  if (deps >= 2 && !body.fund_code) {
    return "Код фонду обов'язковий";
  }

  if (deps >= 3 && !body.description_code) {
    return "Код опису обов'язковий";
  }

  if (deps >= 4 && !body.case_code) {
    return "Код справи обов'язковий";
  }

  return null;
}

async function findArchive(archive_code: string) {
  return await inspectorPrisma.archive.findFirst({
    where: { code: archive_code },
  });
}

async function createHierarchy(body: StructureApplyRequest, deps: number) {
  const ids: NonNullable<StructureApplyResponse["ids"]> = {};

  // 1. Find Archive (don't create, must exist)
  const archive = await findArchive(body.archive_code!);
  if (!archive) {
    throw new Error(`Архів з кодом "${body.archive_code}" не існує`);
  }
  
  console.log(`Using existing archive: ${archive.code}`);
  ids.archive_id = archive.id;

  // 2. Handle Fund (if deps >= 2)
  let fund = null;
  if (deps >= 2) {
    fund = await inspectorPrisma.fund.findFirst({
      where: {
        code: body.fund_code,
        archive_id: archive.id,
      },
    });

    if (!fund) {
      fund = await inspectorPrisma.fund.create({
        data: {
          code: body.fund_code!,
          title: `Фонд ${body.fund_code}`,
          archive_id: archive.id,
        },
      });
      console.log(`Created fund: ${fund.code}`);

      // Update archive children count
      await inspectorPrisma.archive.update({
        where: { id: archive.id },
        data: { children_count: { increment: 1 } },
      });
    } else {
      console.log(`Using existing fund: ${fund.code}`);
    }
    ids.fund_id = fund.id;
  }

  // 3. Handle Description (if deps >= 3)
  let description = null;
  if (deps >= 3 && fund) {
    description = await inspectorPrisma.description.findFirst({
      where: {
        code: body.description_code,
        fund_id: fund.id,
      },
    });

    if (!description) {
      description = await inspectorPrisma.description.create({
        data: {
          code: body.description_code!,
          title: `Опис ${body.description_code}`,
          fund_id: fund.id,
        },
      });
      console.log(`Created description: ${description.code}`);

      // Update fund children count
      await inspectorPrisma.fund.update({
        where: { id: fund.id },
        data: { children_count: { increment: 1 } },
      });
    } else {
      console.log(`Using existing description: ${description.code}`);
    }
    ids.description_id = description.id;
  }

  // 4. Handle Case (if deps >= 4)
  let case_ = null;
  if (deps >= 4 && description) {
    case_ = await inspectorPrisma.case.findFirst({
      where: {
        code: body.case_code,
        description_id: description.id,
      },
    });

    if (!case_) {
      case_ = await inspectorPrisma.case.create({
        data: {
          code: body.case_code!,
          full_code: `${body.archive_code}/${body.fund_code}/${body.description_code}/${body.case_code}`,
          title: `Справа ${body.case_code}`,
          description_id: description.id,
        },
      });
      console.log(`Created case: ${case_.code}`);

      // Update description children count
      await inspectorPrisma.description.update({
        where: { id: description.id },
        data: { children_count: { increment: 1 } },
      });
    } else {
      console.log(`Using existing case: ${case_.code}`);
    }
    ids.case_id = case_.id;
  }

  return ids;
}

// POST - Create new structure (only creates new entities)
export async function POST(
  request: NextRequest
): Promise<NextResponse<StructureApplyResponse>> {
  try {
    const body: StructureApplyRequest = await request.json();

    console.log("Creating new structure:", body);

    const deps = calculateDeps(body);
    const validationError = validateRequiredFields(body, deps);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          applied: {},
          error: validationError,
        },
        { status: 400 }
      );
    }

    const ids = await createHierarchy(body, deps);

    const applied: StructureApplyRequest = {};
    if (body.archive_code) applied.archive_code = body.archive_code;
    if (deps >= 2 && body.fund_code) applied.fund_code = body.fund_code;
    if (deps >= 3 && body.description_code) applied.description_code = body.description_code;
    if (deps >= 4 && body.case_code) applied.case_code = body.case_code;

    return NextResponse.json({
      success: true,
      applied,
      ids,
      message: `Структуру успішно створено`,
    });
  } catch (error) {
    console.error("Structure create error:", error);
    const errorMessage = error instanceof Error ? error.message : "Помилка створення структури";
    return NextResponse.json(
      {
        success: false,
        applied: {},
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing structure (updates existing entities)
export async function PUT(
  request: NextRequest
): Promise<NextResponse<StructureApplyResponse>> {
  try {
    const body: StructureApplyRequest = await request.json();

    console.log("Updating existing structure:", body);

    const deps = calculateDeps(body);
    const validationError = validateRequiredFields(body, deps);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          applied: {},
          error: validationError,
        },
        { status: 400 }
      );
    }

    const ids: NonNullable<StructureApplyResponse["ids"]> = {};

    // 1. Find Archive (must exist)
    const archive = await findArchive(body.archive_code!);
    if (!archive) {
      return NextResponse.json(
        {
          success: false,
          applied: {},
          error: `Архів з кодом "${body.archive_code}" не існує`,
        },
        { status: 400 }
      );
    }
    
    console.log(`Using existing archive: ${archive.code}`);
    ids.archive_id = archive.id;

    // For updates, we need to handle the case where the structure changes
    // This is a simplified version - in practice you might want more complex update logic

    // 2. Handle Fund (if deps >= 2)
    let fund = null;
    if (deps >= 2) {
      fund = await inspectorPrisma.fund.findFirst({
        where: {
          code: body.fund_code,
          archive_id: archive.id,
        },
      });

      if (!fund) {
        return NextResponse.json(
          {
            success: false,
            applied: {},
            error: `Фонд з кодом "${body.fund_code}" не існує в архіві "${body.archive_code}"`,
          },
          { status: 400 }
        );
      }
      console.log(`Using existing fund: ${fund.code}`);
      ids.fund_id = fund.id;
    }

    // 3. Handle Description (if deps >= 3)
    let description = null;
    if (deps >= 3 && fund) {
      description = await inspectorPrisma.description.findFirst({
        where: {
          code: body.description_code,
          fund_id: fund.id,
        },
      });

      if (!description) {
        return NextResponse.json(
          {
            success: false,
            applied: {},
            error: `Опис з кодом "${body.description_code}" не існує в фонді "${body.fund_code}"`,
          },
          { status: 400 }
        );
      }
      console.log(`Using existing description: ${description.code}`);
      ids.description_id = description.id;
    }

    // 4. Handle Case (if deps >= 4)
    let case_ = null;
    if (deps >= 4 && description) {
      case_ = await inspectorPrisma.case.findFirst({
        where: {
          code: body.case_code,
          description_id: description.id,
        },
      });

      if (!case_) {
        return NextResponse.json(
          {
            success: false,
            applied: {},
            error: `Справа з кодом "${body.case_code}" не існує в описі "${body.description_code}"`,
          },
          { status: 400 }
        );
      }

      // Update full_code for case
      case_ = await inspectorPrisma.case.update({
        where: { id: case_.id },
        data: {
          full_code: `${body.archive_code}/${body.fund_code}/${body.description_code}/${body.case_code}`,
        },
      });
      console.log(`Updated existing case: ${case_.code}`);
      ids.case_id = case_.id;
    }

    const applied: StructureApplyRequest = {};
    if (body.archive_code) applied.archive_code = body.archive_code;
    if (deps >= 2 && body.fund_code) applied.fund_code = body.fund_code;
    if (deps >= 3 && body.description_code) applied.description_code = body.description_code;
    if (deps >= 4 && body.case_code) applied.case_code = body.case_code;

    return NextResponse.json({
      success: true,
      applied,
      ids,
      message: `Структуру успішно оновлено`,
    });
  } catch (error) {
    console.error("Structure update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Помилка оновлення структури";
    return NextResponse.json(
      {
        success: false,
        applied: {},
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
