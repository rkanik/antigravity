import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const searchTerm = searchParams.get("q");
        const currentUserId = searchParams.get("uid");

        if (!searchTerm || searchTerm.trim().length === 0) {
            return NextResponse.json({ users: [] });
        }

        const normalizedSearch = searchTerm.toLowerCase().trim();
        const adminAuth = getAdminAuth();

        // List all users from Firebase Authentication
        const listUsersResult = await adminAuth.listUsers(1000); // Max 1000 users per call

        const matchedUsers: any[] = [];

        listUsersResult.users.forEach((userRecord) => {
            // Skip current user
            if (userRecord.uid === currentUserId) return;

            const email = (userRecord.email || "").toLowerCase();
            const displayName = (userRecord.displayName || "").toLowerCase();

            // Search by email or display name
            if (email.includes(normalizedSearch) || displayName.includes(normalizedSearch)) {
                matchedUsers.push({
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName || userRecord.email?.split('@')[0],
                    photoURL: userRecord.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userRecord.displayName || userRecord.email || 'U')}`
                });
            }
        });

        // Limit results to 20
        const limitedResults = matchedUsers.slice(0, 20);

        return NextResponse.json({ users: limitedResults });
    } catch (error) {
        console.error("Error searching users:", error);
        return NextResponse.json(
            { error: "Failed to search users" },
            { status: 500 }
        );
    }
}
