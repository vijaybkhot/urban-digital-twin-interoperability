import { useEffect, useMemo, useState } from "react";
import { formatReadingTimestamp, getCurrentReadingTimestamp, normalizeReadingTimestamp } from "../../app/appState";
import { getRecommendationForPoint } from "../../domain/belief/recommendationService";
import type { BeliefState } from "../../types/belief";
import type {
  BeliefRules,
  MeasurementPointConfig,
  ModelAnnotationConfig,
  ModelAssetConfig,
  ProjectConfig,
} from "../../types/projectConfig";
import { AuditLog } from "../AuditLog/AuditLog";
import type { AuditEvent } from "../../types/audit";
import { ThresholdGuide } from "./ThresholdGuide";

interface SidePanelProps {
  project: ProjectConfig | null;
  selectedPoint: MeasurementPointConfig | null;
  selectedModelAnnotation: ModelAnnotationConfig | null;
  selectedModelAsset: ModelAssetConfig | null;
  selectedLinkedMeasurementPoint: MeasurementPointConfig | null;
  beliefRules: BeliefRules | null;
  auditEvents: AuditEvent[];
  isVisible: boolean;
  onHide: () => void;
  onClearSelection: () => void;
  onResetPosition: () => void;
  onApplyMeasurementUpdate: (
    pointId: string,
    update: { doseRate: number; contamination: number; lastReading: string },
  ) => void;
  onApplyManualOverride: (pointId: string, belief: BeliefState) => void;
  panelRef: React.RefObject<HTMLElement | null>;
  onPanelPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}

const beliefStates: BeliefState[] = ["Low", "Medium", "High"];

export function SidePanel({
  project,
  selectedPoint,
  selectedModelAnnotation,
  selectedModelAsset,
  selectedLinkedMeasurementPoint,
  beliefRules,
  auditEvents,
  isVisible,
  onHide,
  onClearSelection,
  onResetPosition,
  onApplyMeasurementUpdate,
  onApplyManualOverride,
  panelRef,
  onPanelPointerDown,
}: SidePanelProps) {
  const [doseRate, setDoseRate] = useState("");
  const [contamination, setContamination] = useState("");
  const [lastReading, setLastReading] = useState(getCurrentReadingTimestamp());
  const editablePoint = selectedPoint ?? selectedLinkedMeasurementPoint;

  useEffect(() => {
    if (!editablePoint) {
      setDoseRate("");
      setContamination("");
      setLastReading(getCurrentReadingTimestamp());
      return;
    }

    setDoseRate(editablePoint.doseRate.toFixed(2));
    setContamination(String(editablePoint.contamination));
    setLastReading(normalizeReadingTimestamp(editablePoint.lastReading));
  }, [editablePoint]);

  const recommendation = useMemo(() => {
    if (!editablePoint) {
      return "Select a point to see the next recommended action.";
    }

    return getRecommendationForPoint(editablePoint);
  }, [editablePoint]);

  function applyMeasurementUpdate() {
    if (!editablePoint) {
      return;
    }

    const nextDoseRate = Number(doseRate);
    const nextContamination = Number(contamination);

    if (Number.isNaN(nextDoseRate) || Number.isNaN(nextContamination)) {
      return;
    }

    onApplyMeasurementUpdate(editablePoint.id, {
      doseRate: nextDoseRate,
      contamination: nextContamination,
      lastReading,
    });
  }

  return (
    <aside ref={panelRef} className={`info-panel ${isVisible ? "" : "is-hidden"}`}>
      <div className="panel-header" onPointerDown={onPanelPointerDown}>
        <div>
          <p className="panel-kicker">Digital Twin POC</p>
          <h1>Decision Loop Demo</h1>
        </div>
        <div className="panel-controls">
          <button className="panel-button" type="button" onClick={onResetPosition}>
            Move to top-left
          </button>
          <button className="panel-button" type="button" onClick={onClearSelection}>
            Clear selection
          </button>
          <button className="panel-button" type="button" onClick={onHide}>
            Hide
          </button>
        </div>
      </div>

      <p className="panel-intro">
        Click a measurement point or model annotation to inspect it. Drag this
        panel by the header if it covers the scene.
      </p>

      <section className="panel-section">
        <h2>Project</h2>
        <p><strong>ID:</strong> {project?.projectId ?? "-"}</p>
        <p><strong>Name:</strong> {project?.projectName ?? "-"}</p>
        <p><strong>Description:</strong> {project?.description ?? "-"}</p>
      </section>

      {selectedModelAnnotation ? (
        <>
          <section className="panel-section">
            <h2>Model Annotation</h2>
            <p><strong>ID:</strong> {selectedModelAnnotation.id}</p>
            <p><strong>Label:</strong> {selectedModelAnnotation.label}</p>
            <p><strong>Model:</strong> {selectedModelAnnotation.modelAssetId}</p>
            <p>
              <strong>Description:</strong>{" "}
              {selectedModelAnnotation.description ?? "-"}
            </p>
            <p><strong>Coordinate frame:</strong> Local ENU meters</p>
            <p>
              <strong>Local position:</strong>{" "}
              x={selectedModelAnnotation.localPosition.x},{" "}
              y={selectedModelAnnotation.localPosition.y},{" "}
              z={selectedModelAnnotation.localPosition.z}
            </p>
            <p>
              <strong>Asset scale:</strong> {selectedModelAsset?.scale ?? "-"}
            </p>
          </section>

          {selectedLinkedMeasurementPoint && (
            <>
              <section className="panel-section">
                <h2>Linked Sensor</h2>
                <MeasurementPointDetails point={selectedLinkedMeasurementPoint} />
              </section>

              <section className="panel-section">
                <h2>Recommendation</h2>
                <p>{recommendation}</p>
              </section>

              <MeasurementUpdateSection
                doseRate={doseRate}
                contamination={contamination}
                lastReading={lastReading}
                selectedPoint={selectedLinkedMeasurementPoint}
                beliefRules={beliefRules}
                onDoseRateChange={setDoseRate}
                onContaminationChange={setContamination}
                onLastReadingChange={setLastReading}
                onApplyMeasurementUpdate={applyMeasurementUpdate}
              />

              <ManualBeliefOverrideSection
                selectedPoint={selectedLinkedMeasurementPoint}
                onApplyManualOverride={onApplyManualOverride}
              />
            </>
          )}
        </>
      ) : (
        <>
          <section className="panel-section">
            <h2>Selected Point</h2>
            <MeasurementPointDetails point={selectedPoint} />
          </section>

          <section className="panel-section">
            <h2>Recommendation</h2>
            <p>{recommendation}</p>
          </section>

          <MeasurementUpdateSection
            doseRate={doseRate}
            contamination={contamination}
            lastReading={lastReading}
            selectedPoint={selectedPoint}
            beliefRules={beliefRules}
            onDoseRateChange={setDoseRate}
            onContaminationChange={setContamination}
            onLastReadingChange={setLastReading}
            onApplyMeasurementUpdate={applyMeasurementUpdate}
          />

          <ManualBeliefOverrideSection
            selectedPoint={selectedPoint}
            onApplyManualOverride={onApplyManualOverride}
          />
        </>
      )}

      <section className="panel-section">
        <h2>Audit Log</h2>
        <AuditLog events={auditEvents} />
      </section>
    </aside>
  );
}

function MeasurementPointDetails({
  point,
}: {
  point: MeasurementPointConfig | null;
}) {
  return (
    <>
      <p><strong>ID:</strong> {point?.id ?? "None"}</p>
      <p><strong>Name:</strong> {point?.name ?? "Nothing selected yet"}</p>
      <p><strong>Belief:</strong> {point?.belief ?? "-"}</p>
      <p><strong>Sensor Type:</strong> {point?.sensorType ?? "-"}</p>
      <p>
        <strong>Dose Rate:</strong>{" "}
        {point ? `${point.doseRate.toFixed(2)} ${point.doseRateUnit}` : "-"}
      </p>
      <p>
        <strong>Contamination:</strong>{" "}
        {point ? `${point.contamination} ${point.contaminationUnit}` : "-"}
      </p>
      <p>
        <strong>Last Reading:</strong>{" "}
        {point ? formatReadingTimestamp(point.lastReading) : "-"}
      </p>
    </>
  );
}

function MeasurementUpdateSection({
  doseRate,
  contamination,
  lastReading,
  selectedPoint,
  beliefRules,
  onDoseRateChange,
  onContaminationChange,
  onLastReadingChange,
  onApplyMeasurementUpdate,
}: {
  doseRate: string;
  contamination: string;
  lastReading: string;
  selectedPoint: MeasurementPointConfig | null;
  beliefRules: BeliefRules | null;
  onDoseRateChange: (value: string) => void;
  onContaminationChange: (value: string) => void;
  onLastReadingChange: (value: string) => void;
  onApplyMeasurementUpdate: () => void;
}) {
  return (
    <section className="panel-section">
      <h2>Measurement Update</h2>
      <p className="panel-helper">
        Edit the mock readings below. The belief state will be recalculated automatically.
      </p>
      <label className="field-label" htmlFor="doseRateInput">Dose rate (uSv/h)</label>
      <input
        id="doseRateInput"
        className="panel-input"
        type="number"
        min="0"
        step="0.01"
        disabled={!selectedPoint}
        value={doseRate}
        onChange={(event) => onDoseRateChange(event.target.value)}
      />

      <label className="field-label" htmlFor="contaminationInput">Contamination (cpm)</label>
      <input
        id="contaminationInput"
        className="panel-input"
        type="number"
        min="0"
        step="1"
        disabled={!selectedPoint}
        value={contamination}
        onChange={(event) => onContaminationChange(event.target.value)}
      />

      <label className="field-label" htmlFor="lastReadingInput">Last reading date and time</label>
      <input
        id="lastReadingInput"
        className="panel-input"
        type="datetime-local"
        step="60"
        disabled={!selectedPoint}
        value={lastReading}
        onChange={(event) => onLastReadingChange(event.target.value)}
      />

      <button
        className="panel-button panel-action"
        type="button"
        disabled={!selectedPoint}
        onClick={onApplyMeasurementUpdate}
      >
        Apply readings
      </button>

      <ThresholdGuide beliefRules={beliefRules} selectedPoint={selectedPoint} />
    </section>
  );
}

function ManualBeliefOverrideSection({
  selectedPoint,
  onApplyManualOverride,
}: {
  selectedPoint: MeasurementPointConfig | null;
  onApplyManualOverride: (pointId: string, belief: BeliefState) => void;
}) {
  return (
    <section className="panel-section">
      <h2>Manual Belief Override</h2>
      <div className="belief-controls">
        {beliefStates.map((belief) => (
          <button
            key={belief}
            className={`belief-button ${
              selectedPoint?.belief === belief ? "is-active" : ""
            }`}
            type="button"
            disabled={!selectedPoint}
            onClick={() =>
              selectedPoint && onApplyManualOverride(selectedPoint.id, belief)
            }
          >
            {belief}
          </button>
        ))}
      </div>
    </section>
  );
}
