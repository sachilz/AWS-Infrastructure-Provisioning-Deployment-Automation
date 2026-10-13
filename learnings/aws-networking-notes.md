# AWS Cloud Networking & Architecture Notes

## 1. Virtual Private Cloud (VPC)
- **What is a VPC?** A logically isolated virtual network dedicated to your AWS account.
- **CIDR Block (`10.0.0.0/16`)**:
  - `10.0.0.0/16` provides $2^{16} = 65,536$ private IPv4 addresses.
  - Acts as the outer security and IP boundary for our cloud resources.

## 2. Subnets (Public vs. Private)
- **Subnet (`10.0.1.0/24`)**: A partition of the VPC IP range in a specific Availability Zone (e.g., `us-east-1a`).
- **What makes a subnet "Public"?**:
  1. A route in its route table pointing `0.0.0.0/0` to an **Internet Gateway (IGW)**.
  2. Instances launched inside receive a public IP (either auto-assigned or Elastic IP).
- **AWS Reserved IPs**: In any AWS subnet, 5 IPs are always reserved by AWS (Network, VPC router, DNS, future use, broadcast). So a `/24` (256 IPs) has 251 usable IPs.

## 3. Internet Gateway (IGW) & Route Tables
- **Internet Gateway (IGW)**: A horizontally scaled, redundant VPC component that enables communication between resources in your VPC and the internet. Performs 1-to-1 NAT.
- **Route Table**: A set of routing rules determining where network traffic from your subnet is directed.
  - Local route: `10.0.0.0/16 -> local` (handles internal traffic).
  - Default route: `0.0.0.0/0 -> igw-xxxx` (sends outbound traffic to the internet).

## 4. Security Groups vs. Network ACLs
- **Security Group (Stateful)**:
  - Operates at the **instance/ENI level**.
  - If inbound traffic is allowed on port 80, the return response is automatically allowed, regardless of outbound rules.
  - In our project:
    - **Port 22 (SSH)**: Strictly limited to my personal public IP (`/32`).
    - **Port 80 (HTTP)**: Open to `0.0.0.0/0` so anyone can view the web app.
- **Network ACL (Stateless)**: Operates at the **subnet level**; evaluates rules in numerical order for both inbound and outbound separately.
