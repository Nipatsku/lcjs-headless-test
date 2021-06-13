const { lightningChart, renderToPNG } = require("@arction/lcjs-headless");
const {
  PalettedFill,
  LUT,
  ColorRGBA,
  IntensitySeriesTypes,
} = require("@arction/lcjs");
const { PNG } = require("pngjs");
const { createWaterDropDataGenerator } = require("@arction/xydata");
const fs = require("fs");

(async () => {
  const dataDimensions = {
    width: 2500,
    height: 2500,
  };
  const resultSize = {
    width: 1920,
    height: 1080,
  };

  console.time("create chart");
  const lcjs = lightningChart();
  const chart = lcjs
    .ChartXY()
    .setTitle(`Heatmap Grid (${dataDimensions.width}x${dataDimensions.height})`)
    .setPadding({ right: 40 });
  const axisX = chart.getDefaultAxisX().setTitle("X Axis");
  const axisY = chart.getDefaultAxisX().setTitle("Y Axis");
  const series = chart
    .addHeatmapSeries({
      type: IntensitySeriesTypes.Grid,
      columns: dataDimensions.width,
      rows: dataDimensions.height,
      pixelate: true,
      start: { x: -1, y: -1 },
      end: { x: 1, y: 1 },
    })
    .setFillStyle(
      new PalettedFill({
        lookUpProperty: "value",
        lut: new LUT({
          interpolate: true,
          steps: [
            { value: 0.0, label: "0.00", color: ColorRGBA(0, 0, 0) },
            { value: 0.25, label: "0.25", color: ColorRGBA(255, 215, 0) },
            { value: 0.5, label: "0.50", color: ColorRGBA(255, 0, 0) },
            { value: 0.75, label: "0.75", color: ColorRGBA(0, 0, 255) },
            { value: 1.0, label: "1.00", color: ColorRGBA(63, 0, 255) },
          ],
        }),
      })
    );

  chart.engine.renderFrame(resultSize.width, resultSize.height);

  const legend = chart.addLegendBox().add(chart);

  console.timeEnd("create chart");

  console.time("generate test data");
  axisX.setInterval(-1, 1, false, true);
  axisY.setInterval(-1, 1, false, true);
  const rand = (min, max) => min + Math.random() * (max - min);
  const waterDropsConfig = new Array(25).fill(0).map((_) => ({
    rowNormalized: Math.random(),
    columnNormalized: Math.random(),
    amplitude: Math.random(),
  }));
  const data = await createWaterDropDataGenerator()
    .setColumns(dataDimensions.width)
    .setRows(dataDimensions.height)
    .setOffsetLevel(0.1)
    .setVolatility(20)
    .setWaterDrops(waterDropsConfig)
    .generate();
  console.timeEnd("generate test data");

  console.time("render chart");
  series.invalidateValuesOnly(data);
  const frame = renderToPNG(chart, resultSize.width, resultSize.height);
  console.timeEnd("render chart");

  console.time("save image");
  const framePng = PNG.sync.write(frame);
  fs.writeFileSync("./frame.png", framePng);
  console.timeEnd("save image");
})();
