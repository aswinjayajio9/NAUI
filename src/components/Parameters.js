import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  Text,
  Stack,
} from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import { API_BASE_URL } from "./HomePage"; // Import the constant
import { getPayloadForParameters, HideDimensions } from "./payloads";
import { getPayloadFromUrl } from "./o9Interfacehelper";

/*
  ResourceDefinitionPage
  - Clean page: parent provides step control.
*/

export default function ResourceDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  filters,
  onBack,
  onNext,    // injected by DefinitionWizard
  onPrev,    // injected by DefinitionWizard
  isFirst,   // injected by DefinitionWizard
  isLast,    // injected by DefinitionWizard
}) {
  const [detailsView, setDetailsView] = useState("table"); // "table" or "network"
  const [summaryParameters, setSummaryParameters] = useState([]);
  const [summaryParametersLoading, setSummaryParametersLoading] = useState(true);
  const [summaryParametersError, setSummaryParametersError] = useState(null);

  useEffect(() => {
    const loadParameters = async () => {
      setSummaryParametersLoading(true);
      setSummaryParametersError(null);
      try {
        const payload = getPayloadForParameters(srcVersion, tgtPlan);
        let data = await getPayloadFromUrl({ payload }); // Use 'let' instead of 'const'
        if (typeof data === "string") {
          data = JSON.parse(data); // Reassigning 'data' after parsing
        }
        setSummaryParameters(data["Results"]["0"]);
        console.log("Parameters data:", data);
      } catch (error) {
        console.error("Error loading parameters:", error);
        setSummaryParametersError(error.message || "Failed to load parameters");
      } finally {
        setSummaryParametersLoading(false);
      }
    };

    loadParameters();
  }, [srcVersion, tgtPlan]);

  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>Back</Button>
          <Heading size="md">Parameter Definition</Heading>
        </Flex>
        <Stack spacing={0} align="flex-end">
          <Text fontSize="sm" color="gray.600">Source: {srcPlan} / {srcVersion}</Text>
          <Text fontSize="sm" color="gray.600">Target: {tgtPlan} / {tgtVersion}</Text>
        </Stack>
      </Flex>

      {/* Resource Definition - Rules Section */}
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
          Parameters
        </Heading>
        <SimpleGrid columns={1} spacing={6}>
          <SheetComponent 
            dataUrl={`${API_BASE_URL}/read/parameters.csv`}
            data={summaryParameters} // Pass the state here
            isLoading={summaryParametersLoading}
            error={summaryParametersError}
            enableEdit={true}
            hideDims={Object.keys(HideDimensions)}
          />
        </SimpleGrid>
      </Box>

      {/* Page-level navigation (restores Next/Previous buttons on the page) */}
      <Flex mt={4} gap={2} justify="flex-end">
        <Button size="sm" onClick={onPrev} isDisabled={isFirst}>
          Previous
        </Button>
        <Button size="sm" colorScheme="blue" onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </Button>
      </Flex>
    </Box>
  );
}