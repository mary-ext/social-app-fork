/**
 * checks for a drag carrying files from outside the page.
 *
 * @param transfer the drag's data transfer
 * @returns whether the drop would attach files
 */
export const isFileDrag = (transfer: DataTransfer): boolean => {
	return transfer.types.includes('Files');
};
