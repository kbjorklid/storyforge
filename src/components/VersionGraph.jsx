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
                parentId: draft.baseVersionId || currentVersionId,
                timestamp: draft.timestamp,
                title: draft.content.title,
                description: draft.content.description,
                author: 'draft'
            });
        }

        const rootNode = data.find(d => !d.parentId);
        if (!rootNode) return;

        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId)(data);

        const treeLayout = d3.tree().nodeSize([80, 150]); // Increased spacing
        treeLayout(root);

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("font", "12px 'Inter', sans-serif")
            .style("user-select", "none");

        // Define Filters (Glow)
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");

        filter.append("feGaussianBlur")
            .attr("stdDeviation", "3")
            .attr("result", "coloredBlur");

        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const g = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("start", () => svg.style("cursor", "grabbing"))
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            })
            .on("end", () => svg.style("cursor", "grab"));

        svg.call(zoom).style("cursor", "grab");

        // Center logic
        let targetNode = root.descendants().find(d => d.data.id === 'draft');
        if (!targetNode) {
            targetNode = root.descendants().find(d => d.data.id === currentVersionId);
        }
        if (!targetNode && root.descendants().length > 0) {
            const descendants = root.descendants();
            targetNode = descendants[descendants.length - 1];
        }

        const initialScale = 0.8;
        let initialX = margin.left;
        let initialY = height / 2;

        if (targetNode) {
            initialX = (width * 0.5) - (targetNode.y * initialScale);
            initialY = (height / 2) - (targetNode.x * initialScale);
        }

        svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

        // Links
        g.append("g")
            .attr("fill", "none")
            .attr("stroke", "var(--color-text-secondary)")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 2)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr("stroke-dasharray", function () { return this.getTotalLength(); })
            .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
            .transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0);

        // Nodes
        const node = g.append("g")
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                onSelect(d.data.id);
            })
            .on("mouseenter", function () {
                d3.select(this).select("circle")
                    .transition().duration(200)
                    .attr("r", 12)
                    .style("filter", "url(#glow)");
            })
            .on("mouseleave", function (event, d) {
                const isSelected = d.data.id === selectedVersionId || d.data.id === currentVersionId;
                d3.select(this).select("circle")
                    .transition().duration(200)
                    .attr("r", isSelected ? 10 : 6)
                    .style("filter", isSelected ? "url(#glow)" : "none");
            });

        // Node Circles
        node.append("circle")
            .attr("r", 0) // Start at 0 for animation
            .attr("fill", d => {
                if (d.data.id === 'draft') return "var(--color-warning)";
                if (d.data.id === currentVersionId) return "var(--color-accent)";
                if (d.data.id === selectedVersionId) return "var(--color-text-primary)";
                return "var(--color-bg-primary)";
            })
            .attr("stroke", d => {
                if (d.data.id === 'draft') return "var(--color-warning)";
                if (d.data.id === currentVersionId) return "var(--color-accent)";
                if (d.data.id === selectedVersionId) return "var(--color-text-primary)";
                return "var(--color-text-secondary)";
            })
            .attr("stroke-width", 2)
            .style("filter", d => (d.data.id === currentVersionId || d.data.id === selectedVersionId || d.data.id === 'draft') ? "url(#glow)" : "none")
            .transition()
            .duration(500)
            .delay((d, i) => i * 50)
            .attr("r", d => (d.data.id === currentVersionId || d.data.id === selectedVersionId) ? 10 : 6);

        // Labels
        node.append("text")
            .attr("dy", "2.5em")
            .attr("x", 0)
            .attr("text-anchor", "middle")
            .attr("fill", "var(--color-text-primary)")
            .style("opacity", 0)
            .text(d => {
                if (d.data.id === 'draft') return "Draft";
                if (d.data.changeTitle) {
                    return d.data.changeTitle.length > 20
                        ? d.data.changeTitle.substring(0, 20) + '...'
                        : d.data.changeTitle;
                }
                return new Date(d.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            })
            .transition()
            .duration(500)
            .delay((d, i) => i * 50 + 300)
            .style("opacity", 1);

        // Badges (AI/Draft)
        node.each(function (d) {
            if (d.data.author === 'ai') {
                d3.select(this).append("text")
                    .attr("dy", "-1.5em")
                    .attr("text-anchor", "middle")
                    .attr("fill", "var(--color-accent)")
                    .attr("font-weight", "bold")
                    .attr("font-size", "10px")
                    .text("AI")
                    .style("opacity", 0)
                    .transition().delay(500).style("opacity", 1);
            }
        });

    }, [versions, currentVersionId, selectedVersionId, onSelect, draft]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        </div>
    );
};

export default VersionGraph;
