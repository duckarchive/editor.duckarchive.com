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

export async function POST(request: NextRequest): Promise<NextResponse<StructureApplyResponse>> {
  try {
    const body: StructureApplyRequest = await request.json();
    
    console.log("Applying structure changes:", body);
    
    // Validation
    const requiredFields = ['archive_code', 'fund_code', 'description_code', 'case_code'];
    const missingFields = requiredFields.filter(field => !body[field as keyof StructureApplyRequest]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          applied: {},
          error: `Відсутні обов'язкові поля: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const ids: NonNullable<StructureApplyResponse['ids']> = {};

    // 1. Handle Archive
    let archive = await inspectorPrisma.archive.findFirst({
      where: { code: body.archive_code }
    });

    if (!archive) {
      archive = await inspectorPrisma.archive.create({
        data: {
          code: body.archive_code!,
          title: `Архів ${body.archive_code}`,
        }
      });
      console.log(`Created archive: ${archive.code}`);
    } else {
      console.log(`Using existing archive: ${archive.code}`);
    }
    ids.archive_id = archive.id;

    // 2. Handle Fund
    let fund = await inspectorPrisma.fund.findFirst({
      where: { 
        code: body.fund_code,
        archive_id: archive.id
      }
    });

    if (!fund) {
      fund = await inspectorPrisma.fund.create({
        data: {
          code: body.fund_code!,
          title: `Фонд ${body.fund_code}`,
          archive_id: archive.id,
        }
      });
      console.log(`Created fund: ${fund.code}`);
    } else {
      console.log(`Using existing fund: ${fund.code}`);
    }
    ids.fund_id = fund.id;

    // 3. Handle Description
    let description = await inspectorPrisma.description.findFirst({
      where: { 
        code: body.description_code,
        fund_id: fund.id
      }
    });

    if (!description) {
      description = await inspectorPrisma.description.create({
        data: {
          code: body.description_code!,
          title: `Опис ${body.description_code}`,
          fund_id: fund.id,
        }
      });
      console.log(`Created description: ${description.code}`);
    } else {
      console.log(`Using existing description: ${description.code}`);
    }
    ids.description_id = description.id;

    // 4. Handle Case
    let case_ = await inspectorPrisma.case.findFirst({
      where: { 
        code: body.case_code,
        description_id: description.id
      }
    });

    if (!case_) {
      case_ = await inspectorPrisma.case.create({
        data: {
          code: body.case_code!,
          full_code: `${body.archive_code}/${body.fund_code}/${body.description_code}/${body.case_code}`,
          title: `Справа ${body.case_code}`,
          description_id: description.id,
        }
      });
      console.log(`Created case: ${case_.code}`);
    } else {
      // Update full_code if case exists
      case_ = await inspectorPrisma.case.update({
        where: { id: case_.id },
        data: {
          full_code: `${body.archive_code}/${body.fund_code}/${body.description_code}/${body.case_code}`,
        }
      });
      console.log(`Updated existing case: ${case_.code}`);
    }
    ids.case_id = case_.id;

    const applied: StructureApplyRequest = {
      archive_code: body.archive_code,
      fund_code: body.fund_code,
      description_code: body.description_code,
      case_code: body.case_code,
    };

    return NextResponse.json({
      success: true,
      applied,
      ids,
      message: "Структуру успішно створено/оновлено",
    });

  } catch (error) {
    console.error("Structure apply error:", error);
    return NextResponse.json(
      {
        success: false,
        applied: {},
        error: "Помилка застосування змін структури",
      },
      { status: 500 }
    );
  }
}