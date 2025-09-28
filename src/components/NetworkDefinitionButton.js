import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  Text,
  Flex,
  useDisclosure,
} from "@chakra-ui/react";
import { generatePayloadForDimensions } from "./payloads";
import { getPayloadFromUrl, parseMetaDataPayload } from "./o9Interfacehelper";
import { HideDimensions } from "./payloads";
import { Version , NetworkPlanType} from "./payloads";
const NetworkDefinitionButton = ({ firstSheetFilters, onDefine }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [srcPlan, setSrcPlan] = useState("");
  const [srcVersion, setSrcVersion] = useState("");
  const [tgtPlan, setTgtPlan] = useState("");
  const [tgtVersion, setTgtVersion] = useState("");

  const [options, setOptions] = useState({ versions: [], planTypes: [] });

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      const dimensionsToFetch = HideDimensions;

      const payloads = generatePayloadForDimensions(dimensionsToFetch);

      try {
        // Fetch Versions
        const versionPayload = payloads[Version];
        let versionData = await getPayloadFromUrl({ payload: versionPayload });
        if (typeof versionData === 'string') {
            versionData = JSON.parse(versionData);
        }

        const { rows: versionRows } = parseMetaDataPayload(
            versionData.Results ? versionData.Results[0] : versionData
        );
        const versions = [...new Set(versionRows.map(r => r[Version]))];

        // Fetch Plan Types
        const planTypePayload = payloads[NetworkPlanType];
        let planTypeData = await getPayloadFromUrl({ payload: planTypePayload });
        if (typeof planTypeData === 'string') {
            planTypeData = JSON.parse(planTypeData);
        }

        const { rows: planTypeRows } = parseMetaDataPayload(
            planTypeData.Results ? planTypeData.Results[0] : planTypeData
        );
        const planTypes = [...new Set(planTypeRows.map(r => r[NetworkPlanType]))];
        
        setOptions({ versions, planTypes });

        // Set default values
        if (versions.length > 0) {
            setSrcVersion(versions[0]);
            setTgtVersion(versions[0]);
        }
        if (planTypes.length > 0) {
            setSrcPlan(planTypes[0]);
            setTgtPlan(planTypes[0]);
        }

      } catch (error) {
        console.error("Failed to fetch dropdown options:", error);
      }
    };

    if (isOpen) {
      fetchDropdownOptions();
    }
  }, [isOpen]);

  const handleCreate = () => {
    onDefine({ srcPlan, srcVersion, tgtPlan, tgtVersion, filters: firstSheetFilters });
    onClose();
  };

  return (
    <>
      <Button size="sm" onClick={onOpen}>Define New Network</Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW="800px" borderRadius="md" p={4}>
          <ModalHeader fontSize="lg">Network Model Creation</ModalHeader>
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel fontSize="sm">Source Network</FormLabel>
              <Flex gap={3}>
                <FormControl>
                  <FormLabel fontSize="xs">Plan Type</FormLabel>
                  <Select value={srcPlan} onChange={(e) => setSrcPlan(e.target.value)}>
                    {options.planTypes.map(v => <option key={`src-plan-${v}`}>{v}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Version</FormLabel>
                  <Select value={srcVersion} onChange={(e) => setSrcVersion(e.target.value)} menuProps={{ zIndex: 1000 }}>
                    {options.versions.map(v => <option key={`src-ver-${v}`}>{v}</option>)}
                  </Select>
                </FormControl>
              </Flex>
            </FormControl>

            <FormControl mb={3}>
              <FormLabel fontSize="sm">Target Network</FormLabel>
              <Flex gap={3}>
                <FormControl>
                  <FormLabel fontSize="xs">Plan Type</FormLabel>
                  <Select value={tgtPlan} onChange={(e) => setTgtPlan(e.target.value)}>
                    {options.planTypes.map(v => <option key={`tgt-plan-${v}`}>{v}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Version</FormLabel>
                  <Select value={tgtVersion} onChange={(e) => setTgtVersion(e.target.value)} menuProps={{ zIndex: 1000 }}>
                    {options.versions.map(v => <option key={`tgt-ver-${v}`}>{v}</option>)}
                  </Select>
                </FormControl>
              </Flex>
            </FormControl>

            <Text fontSize="sm" color="gray.600" mt={2}>
              Filters from summary sheet: {firstSheetFilters?.activeFilters && Object.keys(firstSheetFilters.activeFilters).length ? JSON.stringify(firstSheetFilters.activeFilters) : "none"}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleCreate}>Create</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default NetworkDefinitionButton;