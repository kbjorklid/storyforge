import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const VersionGraph = ({ versions, currentVersionId, selectedVersionId, onSelect, draft }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!versions || Object.keys(versions).length === 0 || !svgRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const margin = { top: 20, right: 90, bottom: 30, left: 90 };

        // Clear previous render
        d3.select(svgRef.current).selectAll("*").remove();

        // Prepare data for stratify
        const data = Object.values(versions).map(v => ({
            id: v.id,
            parentId: v.parentId,
            ...v
        }));

        if (draft) {
            data.push({
                id: 'draft',
                parentId: draft.baseVersionId || currentVersionId, // Fallback to current if base not found (shouldn't happen)
                timestamp: draft.timestamp,
                title: draft.content.title,
                description: draft.content.description,
                author: 'draft'
            });
        }

        // Handle root(s)
        // If there are multiple roots (which shouldn't happen in a single story tree usually, but legacy might cause it),
        // we might need a virtual root. For now, assume single root or pick one.
        // Actually, stratify expects a single root or we can handle it.
        // Let's find the root.
        const rootNode = data.find(d => !d.parentId);
        if (!rootNode) return; // Should not happen if data is valid

        // Stratify
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId)(data);

        // Tree layout
        // Use tree or cluster. Tree is usually better for history.
        // Size is (height, width) for horizontal layout
        const treeLayout = d3.tree().nodeSize([60, 120]); // Fixed node size for better spacing
        treeLayout(root);

        // SVG Setup
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("font", "10px sans-serif")
            .style("user-select", "none");

        // Zoom behavior
        const g = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Center the tree initially
        // Find bounds
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        root.descendants().forEach(d => {
            minX = Math.min(minX, d.y);
            maxX = Math.max(maxX, d.y);
            minY = Math.min(minY, d.x);
            maxY = Math.max(maxY, d.x);
        });

        // const treeWidth = maxX - minX;
        // const treeHeight = maxY - minY;

        // Initial transform to center and have some padding
        const initialScale = 1;
        const initialX = margin.left; // Start from left
        const initialY = height / 2; // Center vertically relative to root? 
        // Actually, d3.tree places root at (0,0) usually? No, it places it based on layout.
        // With nodeSize, root is at (0,0).

        svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));


        // Links
        g.append("g")
            .attr("fill", "none")
            .attr("stroke", "var(--color-text-secondary)") // Correct variable
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", 2) // Thicker lines
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // Nodes
        const node = g.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        // Add tooltip
        node.append("title")
            .text(d => {
                let tooltip = `Created: ${new Date(d.data.timestamp).toLocaleString()}`;
                if (d.data.changeTitle) {
                    tooltip += `\nChange: ${d.data.changeTitle}`;
                }
                if (d.data.changeDescription) {
                    tooltip += `\n${d.data.changeDescription}`;
                }
                return tooltip;
            });

        // Circles
        node.append("circle")
            .attr("fill", d => {
                if (d.data.id === currentVersionId) return "var(--color-accent)";
                if (d.data.id === selectedVersionId) return "var(--color-text-primary)";
                return "#94a3b8"; // Light gray (slate-400) for better visibility
            })
            .attr("stroke", d => {
                if (d.data.id === currentVersionId) return "var(--color-accent)";
                if (d.data.id === selectedVersionId) return "var(--color-text-primary)";
                if (d.data.id === 'draft') return "var(--color-warning)";
                return "var(--color-text-primary)"; // Bright stroke
            })
            .attr("stroke-dasharray", d => d.data.id === 'draft' ? "2,2" : "none")
            .attr("stroke-width", 2)
            .attr("r", 6)
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                onSelect(d.data.id);
            });

        // Labels
        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -10 : 10)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .attr("fill", "var(--color-text-primary)") // Correct variable
            .text(d => {
                if (d.data.changeTitle) {
                    return d.data.changeTitle.length > 15
                        ? d.data.changeTitle.substring(0, 15) + '...'
                        : d.data.changeTitle;
                }
                return new Date(d.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            })
            .clone(true).lower()
            .attr("stroke", "var(--color-bg-secondary)")
            .attr("stroke-width", 3);

        // AI Badge
        node.each(function (d) {
            if (d.data.author === 'ai') {
                d3.select(this).append("text")
                    .attr("dy", "-1em")
                    .attr("x", 0)
                    .attr("text-anchor", "middle")
                    .attr("fill", "var(--color-accent)")
                    .attr("font-weight", "bold")
                    .attr("font-size", "8px")
                    .text("AI");
            } else if (d.data.author === 'draft') {
                d3.select(this).append("text")
                    .attr("dy", "-1em")
                    .attr("x", 0)
                    .attr("text-anchor", "middle")
                    .attr("fill", "var(--color-warning)")
                    .attr("font-weight", "bold")
                    .attr("font-size", "8px")
                    .text("DRAFT");
            }
        });

    }, [versions, currentVersionId, selectedVersionId, onSelect, draft]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        </div>
    );
};

export default VersionGraph;
