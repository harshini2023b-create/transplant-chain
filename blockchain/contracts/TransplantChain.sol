// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransplantChain {

    // ==========================================
    // ORGAN REGISTRATION RECORDS
    // ==========================================

    struct OrganRegistration {
        string organId;
        string organHash;
        uint256 timestamp;
    }

    mapping(string => OrganRegistration) private registeredOrgans;

    event OrganRegistered(
        string organId,
        string organHash,
        uint256 timestamp
    );

    function registerOrgan(
        string memory organId,
        string memory organHash
    ) public {

        registeredOrgans[organId] = OrganRegistration({
            organId: organId,
            organHash: organHash,
            timestamp: block.timestamp
        });

        emit OrganRegistered(
            organId,
            organHash,
            block.timestamp
        );
    }

    function getOrganRegistration(
        string memory organId
    )
        public
        view
        returns (
            string memory,
            string memory,
            uint256
        )
    {
        OrganRegistration memory organ =
            registeredOrgans[organId];

        return (
            organ.organId,
            organ.organHash,
            organ.timestamp
        );
    }


    // ==========================================
    // IOT DATA RECORDS
    // ==========================================

    struct IoTRecord {
        string organId;
        string dataHash;
        uint256 timestamp;
    }

    mapping(string => IoTRecord[]) private organRecords;

    event IoTHashRecorded(
        string organId,
        string dataHash,
        uint256 timestamp
    );

    function recordIoTHash(
        string memory organId,
        string memory dataHash
    ) public {

        IoTRecord memory newRecord = IoTRecord({
            organId: organId,
            dataHash: dataHash,
            timestamp: block.timestamp
        });

        organRecords[organId].push(newRecord);

        emit IoTHashRecorded(
            organId,
            dataHash,
            block.timestamp
        );
    }

    function getIoTRecordCount(
        string memory organId
    ) public view returns (uint256) {

        return organRecords[organId].length;
    }

    function getIoTRecord(
        string memory organId,
        uint256 index
    )
        public
        view
        returns (
            string memory,
            string memory,
            uint256
        )
    {
        IoTRecord memory record =
            organRecords[organId][index];

        return (
            record.organId,
            record.dataHash,
            record.timestamp
        );
    }


    // ==========================================
    // CHAIN OF CUSTODY RECORDS
    // ==========================================

    struct CustodyRecord {
        string location;
        string custodian;
        string status;
        uint256 timestamp;
    }

    mapping(string => CustodyRecord[]) private custodyRecords;

    event CustodyRecorded(
        string organId,
        string location,
        string custodian,
        string status,
        uint256 timestamp
    );

    function recordCustodyEvent(
        string memory organId,
        string memory location,
        string memory custodian,
        string memory status
    ) public {

        CustodyRecord memory newRecord =
            CustodyRecord({
                location: location,
                custodian: custodian,
                status: status,
                timestamp: block.timestamp
            });

        custodyRecords[organId].push(newRecord);

        emit CustodyRecorded(
            organId,
            location,
            custodian,
            status,
            block.timestamp
        );
    }

    function getCustodyRecordCount(
        string memory organId
    ) public view returns (uint256) {

        return custodyRecords[organId].length;
    }

    function getCustodyRecord(
        string memory organId,
        uint256 index
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256
        )
    {
        CustodyRecord memory record =
            custodyRecords[organId][index];

        return (
            record.location,
            record.custodian,
            record.status,
            record.timestamp
        );
    }
}