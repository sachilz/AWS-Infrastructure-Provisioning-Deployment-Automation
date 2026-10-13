resource "aws_vpc" "main" {            # Creates a Virtual Private Cloud (VPC), our private isolated cloud network.
  cidr_block           = "10.0.0.0/16" # Defines the private IPv4 range for the VPC (65,536 private IPs).
  enable_dns_support   = true          # Enables AWS internal DNS resolution inside this VPC.
  enable_dns_hostnames = true          # Gives public DNS hostnames to instances that have public IPs.

  tags = {                              # Key-value labels to identify and manage resources in the AWS Console.
    Name    = "${var.project_name}-vpc" # Display name shown in the AWS Management Console.
    Project = var.project_name          # Tag used for project identification and cost tracking.
  }
}
