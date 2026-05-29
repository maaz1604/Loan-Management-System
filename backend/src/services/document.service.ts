import Document from "../models/Document.js";

export const DocumentService = {
  upload: async (payload: any) => {
    return Document.create(payload);
  },

  verify: async (documentId: string, verifierId: string) => {

    const doc = await Document.findById(documentId);
    if (!doc) throw new Error('Document not found');
    
    doc.verified = true;
    doc.verifiedBy = verifierId as any;
    doc.verifiedAt = new Date();
    await doc.save();
    return doc;
  },
};
