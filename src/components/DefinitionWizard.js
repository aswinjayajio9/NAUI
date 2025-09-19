import React from "react";
import { Box, Container, Flex, Button } from "@chakra-ui/react";
import NavigateDefinition from "./NavigateDefinition";
import NetworkDefinitionPage from "./NetworkDefinitionPage";
import ResourceDefinitionPage from "./ResourceDefinitionPage";
import ParametersDefinitionPage from "./Parameters";


export default function DefinitionWizard({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  filters,
  onBack,
  previewUrl, // added prop: when provided, clicking the last step redirects here
}) {
  const steps = [
    "Planning Level Definition",
    "Resource Definition",
    "Parameters Definition",
    "Preview Network",
  ];

  const [current, setCurrent] = React.useState(0);

  const goNext = () => {
    if (current < steps.length - 1) setCurrent((c) => c + 1);
    else console.log("DefinitionWizard finished");
  };
  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));

  // jumpTo now redirects when user clicks the final "Preview Network" step
  const jumpTo = (idx) => {
    if (idx === steps.length - 1) {
      if (previewUrl) {
        // open preview in a new tab without keeping a reference to this window
        const newWin = window.open(previewUrl, "_blank");
        if (newWin) newWin.opener = null;
      } else {
        // fallback: do nothing or log
        console.warn("Preview URL not provided for Preview Network step");
      }
      return;
    }
    setCurrent(idx);
  };

  return (
    <Container maxW="100%" p={4}>
      {/* navigation line with Prev/Next on the far right */}
      <Flex position="relative" maxW="100%" mx="auto" px={2} mb={4} align="center" w="100%">
        {/* centered step nav */}
        <Box position="absolute" left="50%" transform="translateX(-50%)" zIndex={1} width="fit-content">
          <NavigateDefinition
            steps={steps}
            current={current}
            onChange={jumpTo}
            onStepChange={(s) => setCurrent(s)}
            onFinish={() => console.log("Wizard finished")}
            showControls={false}
          />
        </Box>

        {/* right-most Prev/Next buttons */}
        <Flex gap={2} ml="auto" zIndex={2}>
          <Button size="sm" variant="outline" onClick={goPrev} isDisabled={current === 0}>
            Previous
          </Button>
          <Button size="sm" colorScheme="blue" onClick={goNext} isDisabled={current === steps.length - 1}>
            Next
          </Button>
        </Flex>
      </Flex>

      {/* page content - full width (like App.js panels) */}
      <Box w="100%" px={{ base: 4, md: 6 }} py={2}>
        {current === 0 && (
          <NetworkDefinitionPage
            srcPlan={srcPlan}
            srcVersion={srcVersion}
            tgtPlan={tgtPlan}
            tgtVersion={tgtVersion}
            filters={filters}
            onBack={onBack}
            onNext={goNext}
            onPrev={goPrev}
            isFirst={current === 0}
            isLast={current === steps.length - 1}
          />
        )}

        {current === 1 && (
          <ResourceDefinitionPage
            srcPlan={srcPlan}
            srcVersion={srcVersion}
            tgtPlan={tgtPlan}
            tgtVersion={tgtVersion}
            filters={filters}
            onBack={onBack}
            onNext={goNext}
            onPrev={goPrev}
            isFirst={current === 0}
            isLast={current === steps.length - 1}
          />
        )}
        {current === 2 && (
          <ParametersDefinitionPage
            srcPlan={srcPlan}
            srcVersion={srcVersion}
            tgtPlan={tgtPlan}
            tgtVersion={tgtVersion}
            filters={filters}
            onBack={onBack}
            onNext={goNext}
            onPrev={goPrev}
            isFirst={current === 0}
            isLast={current === steps.length - 1}
          />
        )}
      </Box>
    </Container>
  );
}