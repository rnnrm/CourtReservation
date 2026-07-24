import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/utils/jwt";
import nodemailer from "nodemailer";

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.userEmail?.toString().trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.appUser.findFirst({ where: { Email: email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // create short-lived reset token
    const resetToken = signToken({ sub: user.Id, email: user.Email, purpose: "reset" }, "1h");
    const encodedToken = base64UrlEncode(resetToken);
    const encodedEmail = base64UrlEncode(user.Email ?? "");

    const frontend = process.env.FRONTEND_URL ?? "http://localhost:52293";
    const resetUrl = `${frontend}/reset?email=${encodedEmail}&token=${encodedToken}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
      }});
      
        let message = `Reset password was requested from ${frontend}
        \nCopy (or click) this address fully into your browser to change your password:
        \n\n${resetUrl}`;

      await transporter.sendMail({
        to: user.Email!,
        from: process.env.SMTP_USER,
        sender: "KenRho site",
        subject: "Password reset",
        text: message,
      });
    } catch (e) {
      // don't fail hard; return token for dev
      return NextResponse.json({ ok: true, resetUrl, warning: "Sending email failed" });
    }
    return NextResponse.json({ ok: true });
    
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}