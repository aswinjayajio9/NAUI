import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  Text,
  Stack,
  useToast,
} from "@chakra-ui/react";
// NavigateDefinition removed from this page (parent will render it)
import SheetComponent from "./SheetComponent";
import NetworkGraph from "./NetworkGraph";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { API_BASE_URL } from "./HomePage"; // Import the constant

// import { resourceRulesPayload, resourceDetailsPayload } from "./payloads";

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

  const [detailsView, setDetailsView] = React.useState("table"); // "table" or "network"
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = React.useState(false);
  const [abdmCompleted, setAbdmCompleted] = React.useState(false); // New state to track if ABDM has completed

  // States for Resource Definition - Rules
  const [resourceRulesData, setResourceRulesData] = useState(null);
  const [resourceRulesLoading, setResourceRulesLoading] = useState(true);
  const [resourceRulesError, setResourceRulesError] = useState(null);

  // States for Resource Definition - Details (loaded after ABDM)
  const [resourceDetailsData, setResourceDetailsData] = useState(null);
  const [resourceDetailsLoading, setResourceDetailsLoading] = useState(false);
  const [resourceDetailsError, setResourceDetailsError] = useState(null);

  const runAbdm = async () => {
    setAbdmRunning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/docs`, { method: "GET" });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "ABDM started", status: "success", duration: 3000 });

      // Load Resource Definition - Details after ABDM is started
      await loadResourceDetails();
      setAbdmCompleted(true); // Set completed after successful ABDM and loading
    } catch (err) {
      toast({ title: "ABDM failed", description: err.message, status: "error", duration: 5000 });
    } finally {
      setAbdmRunning(false);
    }
  };

  const loadResourceDetails = async () => {
    setResourceDetailsLoading(true);
    setResourceDetailsError(null);
    try {
      const data = await getPayloadFromUrl({ url:`${API_BASE_URL}/read_json/resource_definition_details.json`});
      setResourceDetailsData(data);
    } catch (err) {
      setResourceDetailsError(err.message || String(err));
    } finally {
      setResourceDetailsLoading(false);
    }
  };

  useEffect(() => {
    setResourceRulesLoading(true);
    getPayloadFromUrl({ url:`${API_BASE_URL}/read_json/resource_definition_rules.json`})
      .then((data) => {
        setResourceRulesData(data);
      })
      .catch((error) => {
        setResourceRulesError(error.message);
      })
      .finally(() => {
        setResourceRulesLoading(false);
      });
  }, []);

  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>Back</Button>
          <Heading size="md">Resource Definition</Heading>
        </Flex>
        <Stack spacing={0} align="flex-end">
          <Text fontSize="sm" color="gray.600">Source: {srcPlan} / {srcVersion}</Text>
          <Text fontSize="sm" color="gray.600">Target: {tgtPlan} / {tgtVersion}</Text>
        </Stack>
      </Flex>

      {/* Resource Definition - Rules Section */}
      <Box w="100%" mb={6}>
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm">Resource Definition - Rules</Heading>
          <Button
            size="sm"
            colorScheme="teal"
            onClick={runAbdm}
            isLoading={abdmRunning}
            aria-label="Run ABDM"
          >
            Run ABDM
          </Button>
        </Flex>
        <SimpleGrid columns={1} spacing={6}>
        
                <SheetComponent 
                  data={resourceRulesData} 
                  isLoading={resourceRulesLoading} 
                  error={resourceRulesError} 
                />

        </SimpleGrid>
      </Box>

      {/* Summary of Resource Definition */}
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
            Summary of Resource Definition
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
            
            <SheetComponent dataUrl={`${API_BASE_URL}/read/summary_resource1.csv`} />

           
            <SheetComponent dataUrl={`${API_BASE_URL}/read/summary_resource2.csv`} />

        </SimpleGrid>
      </Box>

      {/* Resource Definition - Details (toggle Table / Network) - Only visible after ABDM */}
      {abdmCompleted && (
        <Box w="100%" mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm">Resource Definition - Details</Heading>
          </Flex>

            <SimpleGrid columns={1} spacing={6}>
                <SheetComponent
                  data={resourceDetailsData}
                  isLoading={resourceDetailsLoading}
                  error={resourceDetailsError}
                  config={{ enabled: true, levelDimension: 'Level', targetDimension: 'Item' }} // Adjust config as needed
                />

            </SimpleGrid>
        </Box>
      )}

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