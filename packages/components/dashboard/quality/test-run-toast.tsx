"use client";

import { Toast } from "../../ui";
import type { ToastStep } from "../../ui";
import { useQuality } from "./quality-provider";

const stepLabels = [
  "Preparing the individual run",
  "Running the registered test files",
  "Saving results to the dashboard",
];

export function TestRunToast() {
  const { testRunToast, dismissTestRunToast } = useQuality();
  const steps: ToastStep[] = testRunToast
    ? stepLabels.map((label, index) => ({
        label,
        status:
          testRunToast.status === "loading"
            ? index < testRunToast.currentStep
              ? "complete"
              : index === testRunToast.currentStep
                ? "current"
                : "pending"
            : testRunToast.status === "error" &&
                index === testRunToast.currentStep
              ? "error"
              : testRunToast.currentStep === stepLabels.length ||
                  index < testRunToast.currentStep
                ? "complete"
                : "pending",
      }))
    : [];

  const title =
    !testRunToast
      ? ""
      : testRunToast.status === "loading"
        ? `Running ${testRunToast.itemName} ${testRunToast.itemType} tests`
        : testRunToast.status === "success"
          ? `${testRunToast.itemName} tests completed`
          : testRunToast.status === "warning"
            ? `${testRunToast.itemName} tests finished with failures`
            : `${testRunToast.itemName} test run failed`;
  const description =
    testRunToast?.summary ??
    testRunToast?.error ??
    (testRunToast?.status === "loading"
      ? "This may take a few moments."
      : undefined);

  return (
    <Toast
      description={description}
      mode="steps"
      onClose={dismissTestRunToast}
      open={Boolean(testRunToast?.open)}
      steps={steps}
      title={title}
      variant={testRunToast?.status ?? "success"}
    />
  );
}
