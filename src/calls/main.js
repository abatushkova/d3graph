const container = document.querySelector('.graph');
const width = container.clientWidth;
const height = container.scrollHeight;

const markerBoxWidth = 60;
const markerBoxHeight = 60;
const refX = markerBoxWidth;
const refY = markerBoxHeight / 2;
const markerWidth = markerBoxWidth / 2;
const markerHeight = markerBoxHeight / 2;
const delta = 50;
const arrowPoints = [[-delta, 0], [markerBoxWidth - delta, markerBoxWidth / 2], [-delta, markerBoxWidth]];

const radius = 25;

const icon ={
  'person': './user.svg',
  'call': './phone.svg',
};
const iconSize = 20;

const color = {
  'person': '#d0edf7',
  'call': '#b0ddc7',
  'main': 'rgba(122, 120, 125, .4)',
  'arrow': '#777',
};

const svg = d3.select('.graph')
  .append('svg')
    .attr('viewBox', [0, 0, width, height])
  .call(d3.zoom()
    .scaleExtent([1, 3])
    .on('zoom', function() {
      svg.attr('transform', d3.event.transform)
  }))
  .append('g');

svg.append('defs').append('marker')
  .attr('id', 'arrow')
  .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
  .attr('refX', refX)
  .attr('refY', refY)
  .attr('markerWidth', markerWidth)
  .attr('markerHeight', markerHeight)
  .attr('orient', 'auto')
  .append('path')
    .attr('d', d3.line()(arrowPoints))
    .attr('stroke', color.arrow)
    .attr('fill', color.arrow);

d3.json('./data.json')
  .then(build);

function build(data) {
  generate(data);

  const simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-100).distanceMax(radius*8))
    .force('link', d3.forceLink().id(d => d.id).distance(100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(radius).strength(1).iterations(1))
    .on('tick', ticked);

  simulation.nodes(data.nodes);
  simulation.force('link').links(data.relationships);

  function generate(data) {
    // const cNodes = d3.max(data.nodes.filter(node => node.duration));
    // const cScale = d3.scaleLinear()
    //   .domain([0, cNodes.duration])
    //   .range(['#fff', color.call]);

    const link = svg.selectAll('.link')
      .data(data.relationships)
      .enter().append('path')
        .attr('class', 'link')
        .attr('stroke', color.main)
        .attr('marker-end', 'url(#arrow)');

    const node = svg.selectAll('.node')
      .data(data.nodes)
      .join('g')
        .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    node.append('circle')
      .attr('r', radius)
      // .style('fill', d => d.type === 'person' ? color.person : cScale(d.duration));
      .style('fill', d => d.type === 'person' ? color.person : color.call);

    // node.filter(d => d.name)
    //   .append('text')
    //     .text(d => d.name)
    //     .attr('class', 'title')
    //     .attr('text-anchor', 'middle')
    //     .attr('dy', '.35em');

    node.append('image')
      .attr('href', d => d.type === 'person' ? './user.svg' : './phone.svg')
      .attr('width', iconSize)
      .attr('height', iconSize)
      .attr('stroke', '#fff')
      .attr('transform', `translate(-${iconSize / 2}, -${iconSize / 2})`);
  }

  function ticked() {
    d3.selectAll('.link')
      .attr('d', d => d3.line()([[d.source.x, d.source.y], [d.target.x, d.target.y]]))

    d3.selectAll('.node')
      .attr("transform", d => `translate(${+d.x}, ${+d.y})`);
  }

  function dragstarted(d) {
    simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

