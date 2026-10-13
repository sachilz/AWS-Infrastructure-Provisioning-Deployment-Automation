variable "aws_region" {
  description = "AWS region for project infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for project resources"
  type        = string
  default     = "aws-devops-automation"
}

variable "instance_type" {
  description = "EC2 instance type for the website server"
  type        = string
  default     = "t3.micro"
}

variable "ssh_allowed_cidr" {
  description = "Public IPv4 CIDR allowed to connect over SSH, e.g. 203.0.113.10/32"
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0)) && endswith(var.ssh_allowed_cidr, "/32")
    error_message = "Provide one IPv4 address in /32 CIDR notation to restrict SSH access."
  }
}

variable "public_key_path" {
  description = "Absolute path to the SSH public key on the Terraform control machine"
  type        = string
}
