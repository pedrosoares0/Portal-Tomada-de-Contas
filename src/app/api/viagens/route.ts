import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "viagens.json");

// Helper to read data safely
function readData(): Record<string, string[][]> {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Ensure directory exists
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), "utf8");
      return {};
    }
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(content) || {};
  } catch (e) {
    console.error("Error reading data file:", e);
    return {};
  }
}

// Helper to write data safely
function writeData(data: Record<string, string[][]>) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing data file:", e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    
    if (!month) {
      return NextResponse.json({ error: "Month parameter is required" }, { status: 400 });
    }

    const data = readData();
    const rows = data[month] || null;

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, rows } = body;

    if (!month || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Month and rows are required" }, { status: 400 });
    }

    const data = readData();
    data[month] = rows;
    writeData(data);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
