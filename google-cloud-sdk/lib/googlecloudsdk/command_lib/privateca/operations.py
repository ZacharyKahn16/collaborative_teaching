# Lint as: python3
# -*- coding: utf-8 -*- #
# Copyright 2020 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""General utilities using operations in Privateca commands."""

from __future__ import absolute_import
from __future__ import division
from __future__ import unicode_literals


from googlecloudsdk.api_lib.privateca import base
from googlecloudsdk.api_lib.util import waiter
from googlecloudsdk.core import resources


def GetOperationRef(operation):
  """Get a resource reference to a long running operation."""
  return resources.REGISTRY.ParseRelativeName(
      operation.name, 'privateca.projects.locations.operations')


def Await(operation, progress_message):
  """Waits for operation to complete while displaying in-progress indicator.

  Args:
    operation: The Operation resource.
    progress_message: The message to display with the in-progress indicator.

  Returns:
    The resource that is the result of the operation.
  """
  if operation.done:
    return operation.response

  operation_ref = GetOperationRef(operation)
  poller = waiter.CloudOperationPollerNoResources(
      base.GetClientInstance().projects_locations_operations)
  return waiter.WaitFor(poller, operation_ref, progress_message)
