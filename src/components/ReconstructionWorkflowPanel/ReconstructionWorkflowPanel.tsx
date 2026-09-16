import type { ImageIntakeReview } from "../../types/imageIntake";
import type { ProjectConfig } from "../../types/projectConfig";
import type { ReconstructionJob } from "../../types/reconstruction";
import type { ReconstructionWorkflowStep } from "../../app/useReconstructionWorkflow";
import { getModelAssetViewerSupport } from "../../domain/modelAssetViewerSupport";
import { ImageIntakePanel } from "../ImageIntakePanel/ImageIntakePanel";
import "./ReconstructionWorkflowPanel.css";

interface ReconstructionWorkflowPanelProps {
  step: ReconstructionWorkflowStep;
  projectName: string;
  description: string;
  latitude: string;
  longitude: string;
  config: ProjectConfig;
  review: ImageIntakeReview | null;
  job: ReconstructionJob | null;
  error: string | null;
  locationPickEnabled: boolean;
  hasValidLocation: boolean;
  canStartReconstruction: boolean;
  imageIntakeVersion: number;
  onProjectNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onStartLocationPick: () => void;
  onCancelLocationPick: () => void;
  onViewTypedLocation: () => void;
  onCreateProject: () => void;
  onImageSelectionChange: (
    files: File[],
    review: ImageIntakeReview | null,
  ) => void;
  onStartReconstruction: () => void;
  onResetWorkflow: () => void;
}

function getJobMessage(job: ReconstructionJob | null): string {
  if (!job) {
    return "Preparing the mock reconstruction job...";
  }

  if (job.status === "queued") {
    return "Job accepted. Waiting for the mock COLMAP process to start.";
  }

  if (job.status === "running") {
    return "Mock COLMAP reconstruction is running in this browser demo.";
  }

  if (job.status === "failed") {
    return "The mock reconstruction failed.";
  }

  return "Mock reconstruction completed.";
}

export function ReconstructionWorkflowPanel({
  step,
  projectName,
  description,
  latitude,
  longitude,
  config,
  review,
  job,
  error,
  locationPickEnabled,
  hasValidLocation,
  canStartReconstruction,
  imageIntakeVersion,
  onProjectNameChange,
  onDescriptionChange,
  onLatitudeChange,
  onLongitudeChange,
  onStartLocationPick,
  onCancelLocationPick,
  onViewTypedLocation,
  onCreateProject,
  onImageSelectionChange,
  onStartReconstruction,
  onResetWorkflow,
}: ReconstructionWorkflowPanelProps) {
  const completedAsset = config.modelAssets?.[0] ?? null;
  const viewerSupport = completedAsset
    ? getModelAssetViewerSupport(completedAsset)
    : null;

  return (
    <aside className="reconstruction-workflow-panel">
      <div className="workflow-heading">
        <div>
          <p className="panel-kicker">POC 3D</p>
          <h1>Mock Reconstruction Workflow</h1>
        </div>
        {step !== "setup" && (
          <button
            className="panel-button"
            type="button"
            onClick={onResetWorkflow}
          >
            New project
          </button>
        )}
      </div>

      {step === "setup" && (
        <>
          <p className="workflow-copy">
            Define a project site, review local images, and simulate a COLMAP
            handoff. No files leave this browser.
          </p>

          <label className="field-label" htmlFor="workflowProjectName">
            Project name
          </label>
          <input
            id="workflowProjectName"
            className="panel-input"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            placeholder="Example: Gerrard Hall test"
          />

          <label className="field-label" htmlFor="workflowDescription">
            Description (optional)
          </label>
          <textarea
            id="workflowDescription"
            className="workflow-textarea"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Short purpose or site note"
          />

          <div className="coordinate-grid">
            <label>
              <span>Latitude</span>
              <input
                className="panel-input"
                inputMode="decimal"
                value={latitude}
                onChange={(event) => onLatitudeChange(event.target.value)}
                placeholder="-90 to 90"
              />
            </label>
            <label>
              <span>Longitude</span>
              <input
                className="panel-input"
                inputMode="decimal"
                value={longitude}
                onChange={(event) => onLongitudeChange(event.target.value)}
                placeholder="-180 to 180"
              />
            </label>
          </div>

          <div className="workflow-actions">
            {locationPickEnabled ? (
              <button
                className="panel-button is-active"
                type="button"
                onClick={onCancelLocationPick}
              >
                Cancel globe selection
              </button>
            ) : (
              <button
                className="panel-button"
                type="button"
                onClick={onStartLocationPick}
              >
                Select on globe
              </button>
            )}
            <button
              className="panel-button"
              type="button"
              disabled={!hasValidLocation}
              onClick={onViewTypedLocation}
            >
              View typed location
            </button>
          </div>

          {locationPickEnabled && (
            <p className="workflow-notice">
              Click the ground on the globe. Press Escape to cancel.
            </p>
          )}

          {error && <p className="workflow-error">{error}</p>}

          <div className="workflow-primary-actions">
            <button
              className="workflow-primary-button"
              type="button"
              onClick={onCreateProject}
            >
              Create project
            </button>
          </div>
        </>
      )}

      {step === "intake" && (
        <>
          <ProjectSummary config={config} />
          <div className="workflow-section">
            <ImageIntakePanel
              key={imageIntakeVersion}
              variant="embedded"
              hasProjectLocation
              projectLocation={
                config.siteMarker
                  ? {
                      lat: config.siteMarker.lat,
                      lon: config.siteMarker.lon,
                    }
                  : undefined
              }
              onSelectionChange={onImageSelectionChange}
            />
          </div>

          {review?.readiness.status === "needs_review" && (
            <p className="workflow-notice">
              This image set can be used for an early trial, but more coverage
              may improve reconstruction quality.
            </p>
          )}
          {error && <p className="workflow-error">{error}</p>}
          <button
            className="workflow-primary-button"
            type="button"
            disabled={!canStartReconstruction}
            onClick={onStartReconstruction}
          >
            Start mock reconstruction
          </button>
        </>
      )}

      {step === "reconstructing" && (
        <>
          <ProjectSummary config={config} />
          <section className="workflow-section">
            <h2>Reconstruction status</h2>
            <dl className="workflow-details">
              <div>
                <dt>Job ID</dt>
                <dd>{job?.jobId ?? "Starting..."}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{job?.status ?? "queued"}</dd>
              </div>
            </dl>
            <p className="workflow-notice">{getJobMessage(job)}</p>
            {error && <p className="workflow-error">{error}</p>}
          </section>
        </>
      )}

      {step === "completed" && (
        <>
          <ProjectSummary config={config} />
          <section className="workflow-section">
            <h2>Reconstructed model</h2>
            <p className="workflow-success">
              The mock reconstruction completed and returned a model asset.
            </p>
            <dl className="workflow-details">
              <div>
                <dt>Asset</dt>
                <dd>{completedAsset?.assetId ?? "-"}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{completedAsset?.assetType ?? "-"}</dd>
              </div>
              <div>
                <dt>Asset URL</dt>
                <dd>{completedAsset?.assetUrl ?? "-"}</dd>
              </div>
              <div>
                <dt>Pipeline</dt>
                <dd>{completedAsset?.sourcePipeline ?? "-"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{completedAsset?.status ?? "-"}</dd>
              </div>
              <div>
                <dt>Viewer</dt>
                <dd>{viewerSupport?.label ?? "-"}</dd>
              </div>
            </dl>
            {viewerSupport && (
              <p
                className={
                  viewerSupport.canRenderInCurrentCesiumViewer
                    ? "workflow-success"
                    : "workflow-notice"
                }
              >
                {viewerSupport.message}
              </p>
            )}
          </section>
        </>
      )}
    </aside>
  );
}

function ProjectSummary({ config }: { config: ProjectConfig }) {
  return (
    <section className="workflow-section">
      <h2>{config.projectName}</h2>
      <dl className="workflow-details">
        <div>
          <dt>Project ID</dt>
          <dd>{config.projectId}</dd>
        </div>
        <div>
          <dt>Site</dt>
          <dd>
            {config.scene.center.lat.toFixed(6)},{" "}
            {config.scene.center.lon.toFixed(6)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
