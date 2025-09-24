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
  previewUrl,
}) {
  const steps = [
    "Material Definition",
    "Resource Definition",
    "Parameters Definition",
    "Preview Network",
  ];

  const [current, setCurrent] = React.useState(0);

  const goNext = () => {
    if (current < steps.length - 1) {
      if (current === 2) {
        // Prevent navigation beyond "Parameters Definition"
        console.log("DefinitionWizard finished");
        return;
      }
      setCurrent((c) => c + 1);
    }
  };

  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));

  const jumpTo = (idx) => {
    if (idx === steps.length - 1) {
      if (previewUrl) {
        const newWin = window.open(previewUrl, "_blank");
        if (newWin) newWin.opener = null;
      } else {
        console.warn("Preview URL not provided for Preview Network step");
      }
      return;
    }
    setCurrent(idx);
  };

  return (
    <Container maxW="100%" p={4}>
      <Flex position="relative" maxW="100%" mx="auto" px={2} mb={4} align="center" w="100%">
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

        <Flex gap={2} ml="auto" zIndex={2}>
          <Button size="sm" variant="outline" onClick={goPrev} isDisabled={current === 0}>
            Previous
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={goNext}
            isDisabled={current === steps.length - 1}
          >
            {current === 2 ? "Finish" : "Next"}
          </Button>
        </Flex>
      </Flex>

      <Box w="100%" px={{ base: 4, md: 6 }} py={2}>
        {/* Render all pages but only show the current one */}
        <Box display={current === 0 ? "block" : "none"}>
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
        </Box>

        <Box display={current === 1 ? "block" : "none"}>
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
        </Box>

        <Box display={current === 2 ? "block" : "none"}>
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
        </Box>
      </Box>
    </Container>
  );
}