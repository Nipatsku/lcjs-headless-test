const { lightningChart, renderToPNG } = require("@arction/lcjs-headless");
const {
  PointShape,
  PalettedFill,
  LUT,
  ColorRGBA,
  emptyFill,
} = require("@arction/lcjs");
const { PNG } = require("pngjs");
const fs = require("fs");

(async () => {
  const dataPointsCount = 50 * 1000 * 1000;
  const resultSize = {
    width: 1920,
    height: 1080,
  };

  console.time("create chart");
  const lcjs = lightningChart();
  const chart = lcjs
    .ChartXY()
    .setPadding({ right: 40 })
    .setTitleFillStyle(emptyFill);
  const axisX = chart.getDefaultAxisX().setTitle("X Axis");
  const axisY = chart.getDefaultAxisX().setTitle("Y Axis");
  const series = chart
    .addPointSeries({
      pointShape: PointShape.Circle,
    })
    .setPointFillStyle(
      new PalettedFill({
        lookUpProperty: "value",
        lut: new LUT({
          interpolate: true,
          steps: [
            { value: 0, color: ColorRGBA(255, 215, 0) },
            { value: 80, color: ColorRGBA(255, 0, 0) },
            { value: 100, color: ColorRGBA(0, 0, 255) },
          ],
        }),
      })
    )
    .setIndividualPointSizeEnabled(true)
    .setIndividualPointValueEnabled(true);

  chart.engine.renderFrame(resultSize.width, resultSize.height);

  const legend = chart.addLegendBox().add(chart);

  console.timeEnd("create chart");

  console.time("generate test data");
  const rand = (min, max) => min + Math.random() * (max - min);
  axisX.setInterval(-1, 1, false, true);
  axisY.setInterval(-1, 1, false, true);
  let existingDataPointsCount = 0;
  do {
    let dataPoints = [];
    for (
      let i = 0;
      i < Math.min(dataPointsCount - existingDataPointsCount, 10 * 1000 * 1000);
      i += 1
    ) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      const diff = { x: 0 - x, y: 0 - y };
      const distance = Math.sqrt(diff.x ** 2 + diff.y ** 2);
      const value = rand(0, 100 - distance * 100);
      const size = Math.max(value / (100 / 2), 0);
      if (size > 0) {
        const dataPoint = { x, y, value, size };
        dataPoints.push(dataPoint);
      }
    }
    existingDataPointsCount += dataPoints.length;
    console.log(`append chunk (${dataPoints.length})`);
    series.add(dataPoints);
    dataPoints = [];

    const memory = process.memoryUsage();
    console.log(
      `waiting | existing data amount: ${existingDataPointsCount} | mem ${(
        memory.heapTotal /
        1024 ** 2
      ).toFixed(1)} MB`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (existingDataPointsCount < dataPointsCount);

  console.timeEnd("generate test data");

  console.time("render chart");
  const frame = renderToPNG(chart, resultSize.width, resultSize.height);
  console.timeEnd("render chart");

  console.time("save image");
  const framePng = PNG.sync.write(frame);
  fs.writeFileSync("./frame.png", framePng);
  console.timeEnd("save image");
})();
