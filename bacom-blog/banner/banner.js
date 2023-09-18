import { readFile } from 'fs/promises';
import { getMdast } from '../../utils/mdast-utils.js';
import { select, selectAll } from 'unist-util-select';
import { visitParents } from 'unist-util-visit-parents';

/**
 * Move a node of a specified type from one parent to another.
 * For example, find an image and move the paragraph it is in to another parent.
 * 
 * @param {object} mdast - The MDAST tree to operate on.
 * @param {string} nodeType - The type of node to move.
 * @param {object} toParent - The node to move the target node to.
 * @param {number} targetLevel - Number of levels up from the node to find the 'from' parent.
 */
function moveNode(mdast, nodeType, toParent, targetLevel = 0) {
    visitParents(mdast, nodeType, (node, parents) => {
        const parentLevel = targetLevel + 1;
        if (parents.length < parentLevel) {
            console.warn(`Not enough parent levels to move node of type '${nodeType}'.`);
            return;
        }

        const targetNode = parents[parents.length - targetLevel];
        const fromParent = parents[parents.length - parentLevel];
        console.log(`moving ${targetNode.type} from ${fromParent.type} to ${toParent.type}`);

        fromParent.children = fromParent.children.filter(child => child !== targetNode);
        toParent.children.push(targetNode);

        return false; // Stop traversing
    });
}

export async function convertBanner(mdast) {
    const asideMdPath = new URL('./aside.md', import.meta.url);
    const asideMd = await readFile(asideMdPath, 'utf8');
    const asideMdast = await getMdast(asideMd);
    const tableRows = selectAll('gtRow', asideMdast);
    const tableRow = tableRows[2];
    const tableCells = selectAll('gtCell', tableRow);
    const imageCell = tableCells[0];
    const contentCell = tableCells[1];

    moveNode(mdast, 'image', imageCell, 1);
    const image = select('image', imageCell);
    if (!image) {
        tableRow.children = [contentCell];
    }

    contentCell.children = mdast.children;
    mdast.children = asideMdast.children;
}
