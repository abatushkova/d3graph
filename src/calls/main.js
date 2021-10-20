const container = document.querySelector('.graph');
const width = container.clientWidth;
const height = container.scrollHeight;
const lineHeight = 20;

const markerBoxWidth = 60;
const markerBoxHeight = 60;
const refX = markerBoxWidth;
const refY = markerBoxHeight / 2;
const markerWidth = markerBoxWidth / 2;
const markerHeight = markerBoxHeight / 2;
const delta = 50;
const arrowPoints = [[-delta, 0], [markerBoxWidth - delta, markerBoxWidth / 2], [-delta, markerBoxWidth]];

const radius = 25;

const icon = {
  'person': './user.svg',
  'call': './phone.svg',
};
const iconSize = 20;

const color = {
  'person': '#d0edf7',
  'call': '#b0ddc7',
  'main': 'rgba(122, 120, 125, .5)',
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

// svg.append('defs').append('filter')
//   .attr('id', 'shadow')
//   .append('feDropShadow')
//     .attr('dx', 1)
//     .attr('dy', 1)
//     .attr('stdDeviation', 4)
//     .attr('flood-opacity', '.25');

const filter = svg.append('defs').append('filter')
  .attr('id', 'shadow');

filter.append('feGaussianBlur')
  .attr('in', 'SourceAlpha')
  .attr('stdDeviation', 4)
  .attr('result', 'blur');

filter.append('feOffset')
  .attr('in', 'blur')
  .attr('dx', 2)
  .attr('dy', 3)
  .attr('result', 'offsetBlur');

filter.append('feFlood')
  .attr('flood-color', 'black')
  .attr('flood-opacity', .2)
  .attr('result', 'offsetColor');

filter.append('feComposite')
  .attr('in', 'offsetColor')
  .attr('in2', 'offsetBlur')
  .attr('operator', 'in')
  .attr('result', 'offsetBlur');

const feMerge = filter.append('feMerge')
feMerge.append('feMergeNode')
  .attr('in', 'offsetBlur');

feMerge.append('feMergeNode')
 .attr('in', 'SourceGraphic');

d3.json('./data.json')
  .then(build);

function build(data) {
  generate(data);

  const linkScale = d3.scaleLinear()
    .domain([0, data.nodes.length]) // test with ~1000 nodes
    .range([10, 100]);

  const simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-300).distanceMax(radius * 1))
    // .force('link', d3.forceLink().id(d => d.id).distance(100).iterations(1))
    .force('link', d3.forceLink().id(d => d.id).distance(linkScale(data.nodes.length)))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(radius * 2).strength(.3).iterations(1))
    .alpha(1)
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
      .enter().append('g')
        .attr('class', 'link');

    link.append('path')
      .attr('id', (d, i) => `path_${i}`)
      .attr('stroke', color.main)
      .attr('marker-end', 'url(#arrow)');

    const label = link.append('g');

    label.append('text')
      .attr('class', 'link__label_bg')
      .call(addLabelText);

    label.append('text')
      .attr('class', 'link__label')
      .call(addLabelText);

    const node = svg.selectAll('.node')
      .data(data.nodes)
      .enter().append('g')
        .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', toggleTooltip);

    node.append('circle')
      .attr('r', radius)
      .attr('fill', d => d.type === 'person' ? color.person : color.call);
      // .style('fill', d => d.type === 'person' ? color.person : cScale(d.duration));

    // node.filter(d => d.name)
    //   .append('text')
    //     .text(d => d.name)
    //     .attr('class', 'title')
    //     .attr('text-anchor', 'middle')
    //     .attr('dy', '.35em');

    node.append('circle')
      .attr('class', 'node__stroke')
      .attr('r', radius + 3)
      // .attr('stroke-dasharray', '2')
      .attr('stroke-width', '6');

    node.append('image')
      .attr('href', d => d.type === 'person' ? './user.svg' : './phone.svg')
      .attr('width', iconSize)
      .attr('height', iconSize)
      .attr('transform', `translate(-${iconSize / 2}, -${iconSize / 2})`);
  }

  function ticked() {
    d3.selectAll('.link path')
      .attr('d', d => d3.line()([[d.source.x, d.source.y], [d.target.x, d.target.y]]));

    d3.selectAll('.node')
      .attr("transform", d => `translate(${+d.x}, ${+d.y})`);
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function addLabelText(selection) {
    const labelText = selection
      .attr('dy', '.35em')
      .append('textPath')
        .attr('xlink:href', (d, i) => `#path_${i}`)
        .attr('startOffset', '50%')
        .text(d => d.type.toUpperCase());

    return labelText;
  }

  function toggleTooltip(d) {
    // if (!d.properties) return;

    const selectedNode = d3.select(this);
    const nodeProps = d.properties;
    const tooltipLength = getTooltipLength(nodeProps) * 10;
    const tooltipLabelLength = (d.type.length * 10) + 10;
    const nodePropsLength = Object.keys(nodeProps).length;

    if (selectedNode.classed('active')) {
      selectedNode.classed('active', false)
        .selectAll('.tooltip')
        .remove();
    } else {
      const tooltip = selectedNode.raise()
        .classed('active', true)
        .append('g')
          .attr('class', 'tooltip')
          // .attr('transform', `translate(20, ${-lineHeight * (nodePropsLength + 1)})`);
          .attr('transform', `translate(0, 0)`);

      const tooltip_content = tooltip.append('g');
      const tooltip_label = tooltip.append('g')
        .attr('transform', `translate(${(tooltipLength - tooltipLabelLength) / 2}, ${0 - lineHeight / 2})`);

      tooltip_content.append('rect')
        .attr('class', 'tooltip__content')
        .attr('width', tooltipLength)
        .attr('height', lineHeight * nodePropsLength)
        .attr('rx', 4)
        .attr('stroke', d => d.type === 'person' ? color.person : color.call)
        .attr('stroke-width', '3')
        .attr('filter', 'url(#shadow)');

      tooltip_content.append('text')
        .selectAll('.tooltip__text')
        .data(d => Object.entries(nodeProps))
        .enter().append('tspan')
          .attr('class', 'tooltip__text')
          .attr('x', 0)
          .attr('dy', lineHeight)
          .text(d => `${d[0]} : ${capitalizeFirstLetter(d[1])}`);

      tooltip_label.append('rect')
        .attr('width', tooltipLabelLength)
        .attr('height', lineHeight)
        .attr('rx', 2)
        .attr('fill', d => d.type === 'person' ? color.person : color.call);

      tooltip_label.append('text')
        .attr('class', 'tooltip__text tooltip__name')
        .attr('x', tooltipLabelLength / 2)
        .attr('y', lineHeight / 2)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .text(d => capitalizeFirstLetter(d.type));
      }
  }

  function getTooltipLength(props) {
    const tooltipLengthList = Object.entries(props)
      .map((prop) => prop.join('').length)
      .sort((a, b) => b - a);

    return tooltipLengthList[0];
  }

  function capitalizeFirstLetter(word) {
    if (typeof(word) !== 'string' ) return word;

    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}

