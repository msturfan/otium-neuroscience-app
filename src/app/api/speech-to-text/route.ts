import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  let tempAudioPath: string | null = null;

  try {
    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to temporary file
    const tempDir = tmpdir();
    const tempFileName = `whisper-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
    tempAudioPath = join(tempDir, tempFileName);

    await writeFile(tempAudioPath, buffer);

    // Get the path to the Python script
    // Assuming whisper_service.py is in the project root
    const projectRoot = process.cwd();
    const pythonScriptPath = join(projectRoot, "whisper_service.py");

    // Check if Python script exists
    const { access } = await import("fs/promises");
    try {
      await access(pythonScriptPath);
    } catch {
      return NextResponse.json(
        {
          error:
            "Whisper service not found. Please ensure whisper_service.py exists in the project root.",
        },
        { status: 500 },
      );
    }

    // Call Python script with the audio file
    // Use python3 or python depending on the system
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const command = `${pythonCommand} "${pythonScriptPath}" "${tempAudioPath}" "en"`;

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for output
      timeout: 120000, // 2 minute timeout
    });

    // Parse the JSON response from Python script
    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch (parseError) {
      console.error("Failed to parse Python output:", stdout, stderr);
      throw new Error("Invalid response from transcription service");
    }

    // Clean up temp file
    if (tempAudioPath) {
      try {
        await unlink(tempAudioPath);
      } catch (cleanupError) {
        console.warn("Failed to delete temp file:", cleanupError);
      }
    }

    if (!result.success || !result.transcript) {
      return NextResponse.json(
        {
          error: result.error || "Transcription failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      transcript: result.transcript,
      success: true,
    });
  } catch (error) {
    // Clean up temp file on error
    if (tempAudioPath) {
      try {
        await unlink(tempAudioPath);
      } catch (cleanupError) {
        console.warn("Failed to delete temp file on error:", cleanupError);
      }
    }

    console.error("Speech-to-text error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
