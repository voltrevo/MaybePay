// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

contract MaybePay {
    mapping(address => uint) public balances;
    mapping(bytes32 => bool) public claimsProcessed;

    constructor() {}

    receive() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function claim(
        uint amount,
        address consumer,
        uint serverSecret,
        uint consumerMixer,
        uint threshold,
        bytes calldata consumerSignature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(
                // In the context of this chain,
                block.chainid,

                // and this MaybePay deposit contract,
                this,

                // I (the consumer) authorize sending
                amount,

                // to (the service provider)
                msg.sender,

                // if the preimage of
                keccak256(abi.encodePacked(serverSecret)),

                // plus
                consumerMixer,

                // is less than
                threshold
            ))
        ));

        require(
            verifySignature(consumer, messageHash, consumerSignature),
            "Signature verification failed"
        );

        require(
            serverSecret + consumerMixer < threshold,
            "Threshold not satisfied"
        );

        require(
            claimsProcessed[messageHash] == false,
            "Claim has already been processed"
        );

        claimsProcessed[messageHash] = true;

        require(
            balances[consumer] >= amount,

            // ENHANCEMENT: Add overdraw/reputation system to help prevent this
            // possibility
            "Consumer insufficient funds"
        );

        balances[consumer] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function verifySignature(
        address signer,
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        require(signature.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        return ecrecover(messageHash, v, r, s) == signer;
    }
}
