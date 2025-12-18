import { getSupabaseClient } from "@/lib/supabase";

/**
 * Gets list of all PDF files in a Supabase Storage bucket
 * @param bucketName - Name of the storage bucket
 * @returns Array of PDF file names
 */
export async function getAllPdfFiles(bucketName: string, folderPath: string = ''): Promise<string[]> {
  try {
    console.log(`🔍 Scanning ${bucketName} bucket${folderPath ? `/${folderPath}` : ''} for PDF files...`);
    
    // List files in the specified path (or root if empty)
    const { data: files, error } = await getSupabaseClient().storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`❌ Bucket list error:`, error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
    
    console.log(`📦 Raw bucket response:`, { 
      filesCount: files?.length || 0,
      files: files?.map(f => ({ name: f.name, id: f.id })) || []
    });
    
    if (!files || files.length === 0) {
      console.log(`⚠️ No files found in ${bucketName} bucket`);
      console.log(`   Check: 1) Bucket exists, 2) Has files, 3) Permissions are correct`);
      return [];
    }
    
    // Filter only PDF files (not folders or placeholders)
    const pdfFiles = files
      .filter(file => {
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const isFolder = file.id === null; // Folders have null id
        const isPlaceholder = file.name.startsWith('.'); // Ignore hidden files
        console.log(`   File: ${file.name} - PDF: ${isPdf}, Folder: ${isFolder}, Placeholder: ${isPlaceholder}`);
        return isPdf && !isFolder && !isPlaceholder;
      })
      .map(file => file.name);
    
    console.log(`📄 Found ${pdfFiles.length} PDF files out of ${files.length} total items`);
    if (pdfFiles.length > 0) {
      console.log(`   PDF Files: ${pdfFiles.join(", ")}`);
    } else {
      console.log(`   ⚠️ No PDF files found. Items in bucket: ${files.map(f => f.name).join(", ")}`);
    }
    
    return pdfFiles;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Error scanning bucket: ${errorMessage}`);
    console.error(`   Full error:`, error);
    return [];
  }
}

/**
 * Downloads a file from Supabase Storage and calculates its SHA256 hash
 * @param bucketName - Name of the storage bucket
 * @param fileName - Name of the file
 * @returns SHA256 hash of the file content
 */
export async function calculateDocumentHash(
  bucketName: string,
  fileName: string
): Promise<string> {
  try {
    const { data, error } = await getSupabaseClient().storage
      .from(bucketName)
      .download(fileName);
    
    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("No data received from storage");
    }
    
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Calculate SHA256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Error calculating hash: ${errorMessage}`);
    throw error;
  }
}
