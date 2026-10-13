terraform {
  required_version = ">= 1.5.0" #specifies which Terraform CLI versions this project supports.

  required_providers { #tells Terraform which providers the project needs.
    aws = {
      source  = "hashicorp/aws" #identifies the official AWS provider.
      version = "~> 6.0"        #allows compatible AWS provider releases within the 6.x series, but not 7.x.
    }
  }
}
