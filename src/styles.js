// Styles de la carte (Shadow DOM). Card styles (Shadow DOM).
export const cardStyles = `
:host { display: block; }
ha-card { overflow: hidden; }
div.card {
  background: var(--ha-card-background, var(--card-background-color, #fff));
  border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;
  box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,.1));
}
.header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 12px 8px 16px;
}
.header .text { flex: 1; min-width: 0; }
.header .title {
  font-size: var(--ha-font-size-l, 16px); font-weight: 500;
  color: var(--primary-text-color); line-height: 1.3;
}
.header .sub {
  font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
button.icon-btn {
  all: unset; box-sizing: border-box; cursor: pointer;
  width: 36px; height: 36px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--secondary-text-color);
  --mdc-icon-size: 20px;
}
button.icon-btn:hover { background: var(--secondary-background-color, rgba(127,127,127,.12)); }
button.icon-btn:focus-visible { outline: 2px solid var(--primary-color); }
button.icon-btn.spin ha-icon, button.icon-btn.spin .glyph { animation: fmc-spin 1s linear infinite; }
@keyframes fmc-spin { to { transform: rotate(360deg); } }
.glyph { font-size: 18px; line-height: 1; }

.map-wrap { position: relative; }
.list-first .map-wrap { margin-top: 4px; }
.fuels {
  display: flex; gap: 6px; padding: 0 16px 10px; overflow-x: auto; scrollbar-width: none;
}
.fuels::-webkit-scrollbar { display: none; }
button.fuel-tab {
  all: unset; box-sizing: border-box; cursor: pointer; flex: none;
  padding: 4px 14px; border-radius: 16px; font-size: 13px; font-weight: 500; line-height: 20px;
  color: var(--primary-text-color);
  border: 1px solid var(--divider-color, rgba(127,127,127,.3));
}
button.fuel-tab:hover { background: var(--secondary-background-color, rgba(127,127,127,.1)); }
button.fuel-tab:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
button.fuel-tab.active {
  background: var(--primary-color, #03a9f4); border-color: var(--primary-color, #03a9f4);
  color: var(--text-primary-color, #fff);
}
.map { width: 100%; background: var(--secondary-background-color, #eee); z-index: 0; }
.map-wrap .recenter {
  position: absolute; right: 10px; bottom: 22px; z-index: 500;
  background: var(--card-background-color, #fff);
  box-shadow: 0 1px 4px rgba(0,0,0,.3);
  color: var(--primary-text-color);
}
.invert-tiles .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(.95) contrast(.9); }
.leaflet-container { font: inherit; background: var(--secondary-background-color, #ddd); }
.leaflet-control-attribution { font-size: 10px; }
.dark .leaflet-control-attribution { background: rgba(0,0,0,.6); color: #ccc; }
.dark .leaflet-control-attribution a { color: #9cf; }
.leaflet-bar a, .leaflet-bar a:hover {
  background: var(--card-background-color, #fff); color: var(--primary-text-color);
  border-bottom-color: var(--divider-color, #ccc);
}

/* Pastilles de prix. Price pins. */
.fmc-icon { width: 0 !important; height: 0 !important; border: 0; background: none; }
.pin {
  position: absolute; left: 0; top: 0; transform: translate(-50%, calc(-100% - 6px));
  padding: 2px 7px; border-radius: 11px; white-space: nowrap;
  font-size: 11px; font-weight: 600; line-height: 18px;
  background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121);
  border: 2px solid var(--card-background-color, #fff);
  box-shadow: 0 1px 4px rgba(0,0,0,.35); cursor: pointer;
  transition: transform .15s;
}
.pin::after {
  content: ""; position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
  border: 6px solid transparent; border-bottom: 0;
  border-top-color: var(--card-background-color, #fff);
}
.pin.low { background: #2e7d32; border-color: #2e7d32; color: #fff; }
.pin.low::after { border-top-color: #2e7d32; }
.pin.high { background: #c62828; border-color: #c62828; color: #fff; }
.pin.high::after { border-top-color: #c62828; }
.pin.selected {
  transform: translate(-50%, calc(-100% - 6px)) scale(1.25);
  border-color: var(--primary-color, #03a9f4);
}
.pin.selected::after { border-top-color: var(--primary-color, #03a9f4); }

.car {
  position: absolute; left: 0; top: 0; transform: translate(-50%, -50%);
  width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
  border: 3px solid var(--primary-color, #03a9f4);
  background: var(--card-background-color, #fff);
  box-shadow: 0 1px 5px rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
  color: var(--primary-color, #03a9f4); --mdc-icon-size: 22px;
}
.car img { width: 100%; height: 100%; object-fit: cover; }

.popup .name { font-weight: 600; }
.popup .addr { color: #555; font-size: 12px; margin: 2px 0 4px; }
.popup .line { font-size: 12px; }
.popup a { font-size: 12px; }

.msg {
  padding: 12px 16px; font-size: 14px; color: var(--secondary-text-color);
}
.msg.error { color: var(--error-color, #db4437); }
.msg[hidden], .header[hidden], [hidden] { display: none !important; }

/* Liste. List. */
.list { padding: 4px 0 8px; }
.list[hidden] { display: none; }
.row {
  display: grid; align-items: center; column-gap: 10px;
  grid-template-columns: var(--fmc-cols, 32px minmax(0, 1fr) 58px 64px 34px);
  padding: 7px 12px 7px 16px; cursor: pointer;
  border-left: 3px solid transparent;
  outline: none;
}
.row:hover { background: var(--secondary-background-color, rgba(127,127,127,.08)); }
.row:focus-visible { background: var(--secondary-background-color, rgba(127,127,127,.12)); }
.row.selected {
  border-left-color: var(--primary-color, #03a9f4);
  background: rgba(var(--rgb-primary-color, 3,169,244), .10);
}
.logo {
  width: 32px; height: 32px; border-radius: 6px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #fff; color: #757575; --mdc-icon-size: 20px;
  box-shadow: inset 0 0 0 1px var(--divider-color, rgba(0,0,0,.08));
}
.logo img { width: 90%; height: 90%; object-fit: contain; }
.who { min-width: 0; }
.who .name {
  font-size: 14px; color: var(--primary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.who .city {
  font-size: 12px; color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dist, .upd { font-size: 12px; color: var(--secondary-text-color); text-align: right; white-space: nowrap; }
.upd { min-width: 30px; }
.upd.stale { color: var(--warning-color, #f57c00); }
.price { font-size: 14px; font-weight: 600; text-align: right; white-space: nowrap; color: var(--primary-text-color); }
.row.low .price { color: #2e7d32; }
.row.high .price { color: #c62828; }
.list .head {
  display: grid; column-gap: 10px;
  grid-template-columns: var(--fmc-cols, 32px minmax(0, 1fr) 58px 64px 34px);
  padding: 0 12px 2px 19px; font-size: 11px; text-transform: uppercase;
  letter-spacing: .04em; color: var(--secondary-text-color);
}
.list .head span:nth-child(n+3) { text-align: right; }
`;
