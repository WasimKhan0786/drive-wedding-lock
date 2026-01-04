// Dropbox integration removed in favor of YouTube
// Keeping file as placeholder to avoid compilation errors until full cleanup

export const dbx = {
    // Mock methods that do nothing or throw errors to signal deprecation
    filesGetTemporaryUploadLink: async () => { throw new Error("Dropbox upload is disabled") },
    filesListFolder: async () => { return { result: { entries: [] } } },
    filesGetTemporaryLink: async () => { throw new Error("Dropbox is disabled") },
    usersGetSpaceUsage: async () => { return { result: { used: 0, allocation: { allocated: 0 } } } }
};

export const getTemporaryUploadLink = async () => { throw new Error("Dropbox upload is disabled"); };
export const getDropboxVideos = async () => { return []; };
export const deleteFromDropbox = async () => {};
export const getDropboxUsage = async () => { return { used: 0, allocated: 0 }; };
